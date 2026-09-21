<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Users;

use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Security\Application\UsernameLookupDigest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Support\EncryptedTransportRequestBuilder;
use Tests\Support\EncryptedTransportResponseReader;
use Tests\TestCase;

final class UserAccountEndpointTest extends TestCase
{
    use RefreshDatabase;

    private string $transportKey = '';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('data_protection.keys', [
            'current' => [
                'key_id' => 'test-data-2026-01',
                'key_base64' => base64_encode(str_repeat('d', 32)),
            ],
            'retiring' => [],
        ]);
        Config::set('data_protection.username_lookup_key_base64', base64_encode(str_repeat('l', 32)));
    }

    public function test_an_admin_can_list_accounts_with_decrypted_profile_fields(): void
    {
        $admin = $this->createUser('accounts.admin', 'Accounts Admin', StaffRole::Admin);
        $this->createUser('accounts.staff', 'Accounts Staff', StaffRole::Staff);
        $this->actingAs($admin, 'web');

        $payload = $this->payload('GET', '/api/v1/users?perPage=1');

        $this->assertSame(2, $payload['meta']['total']);
        $this->assertSame(1, $payload['meta']['perPage']);
        $this->assertSame('accounts.admin', $payload['data'][0]['username']);
        $this->assertSame('admin', $payload['data'][0]['role']);
        $this->assertTrue($payload['data'][0]['active']);
    }

    public function test_staff_cannot_access_account_management(): void
    {
        $this->actingAs($this->createUser('accounts.staff', 'Accounts Staff'), 'web');

        $this->encryptedRequest('GET', '/api/v1/users')->assertForbidden();
    }

    public function test_an_admin_can_create_read_and_update_an_account(): void
    {
        $this->actingAs($this->createUser('accounts.admin', 'Accounts Admin', StaffRole::Admin), 'web');
        $csrfToken = $this->csrfToken();

        $created = $this->encryptedRequest('POST', '/api/v1/users', [
            'username' => 'new.staff',
            'fullName' => 'New Staff',
            'password' => 'AReallySecurePassword!2026',
            'role' => 'staff',
        ], $csrfToken)->assertCreated();
        $createdPayload = $this->responsePayload($created, 'POST', '/api/v1/users');
        $userId = $createdPayload['data']['id'];

        $this->assertSame('new.staff', $createdPayload['data']['username']);
        $this->assertSame('New Staff', $createdPayload['data']['fullName']);
        $this->assertSame('staff', $createdPayload['data']['role']);
        $this->assertTrue($createdPayload['data']['active']);

        $stored = DB::table('users')->where('id', $userId)->first();
        $this->assertNotNull($stored);
        $this->assertStringStartsWith('v1:test-data-2026-01:', $stored->username_encrypted);
        $this->assertStringNotContainsString('new.staff', $stored->username_encrypted);
        $this->assertStringNotContainsString('New Staff', $stored->full_name_encrypted);

        $detail = $this->encryptedRequest('GET', '/api/v1/users/'.$userId)->assertOk();
        $this->assertSame($createdPayload['data'], $this->responsePayload($detail, 'GET', '/api/v1/users/'.$userId)['data']);

        $updated = $this->encryptedRequest('PATCH', '/api/v1/users/'.$userId, [
            'fullName' => 'Updated Staff',
            'role' => 'admin',
            'active' => false,
        ], $csrfToken)->assertOk();
        $updatedData = $this->responsePayload($updated, 'PATCH', '/api/v1/users/'.$userId)['data'];

        $this->assertSame('Updated Staff', $updatedData['fullName']);
        $this->assertSame('admin', $updatedData['role']);
        $this->assertFalse($updatedData['active']);
    }

    public function test_create_rejects_duplicate_usernames_and_invalid_account_fields(): void
    {
        $this->createUser('accounts.admin', 'Accounts Admin', StaffRole::Admin);
        $this->createUser('existing.staff', 'Existing Staff');
        $this->actingAs(User::query()->where('username_lookup_digest', app(UsernameLookupDigest::class)->digest('accounts.admin'))->firstOrFail(), 'web');
        $csrfToken = $this->csrfToken();

        $duplicate = $this->encryptedRequest('POST', '/api/v1/users', [
            'username' => 'EXISTING.STAFF',
            'fullName' => 'Another Staff',
            'password' => 'AReallySecurePassword!2026',
            'role' => 'staff',
        ], $csrfToken)->assertStatus(409);
        $this->assertSame('conflict', $this->responsePayload($duplicate, 'POST', '/api/v1/users')['error']['code']);

        $invalid = $this->encryptedRequest('POST', '/api/v1/users', [
            'username' => 'bad username',
            'fullName' => '',
            'password' => 'short',
            'role' => 'owner',
        ], $csrfToken)->assertUnprocessable();
        $details = $this->responsePayload($invalid, 'POST', '/api/v1/users')['error']['details'];
        $this->assertArrayHasKey('username', $details);
        $this->assertArrayHasKey('fullName', $details);
        $this->assertArrayHasKey('password', $details);
        $this->assertArrayHasKey('role', $details);
    }

    /** @return array<string, mixed> */
    private function payload(string $method, string $path): array
    {
        return $this->responsePayload($this->encryptedRequest($method, $path), $method, $path);
    }

    /** @param array<string, mixed> $data */
    private function encryptedRequest(string $method, string $path, array $data = [], ?string $csrfToken = null): TestResponse
    {
        $builder = new EncryptedTransportRequestBuilder;
        $key = $data === [] ? $builder->buildBodyless() : $builder->build($method, $path, $data);
        $this->transportKey = $key['aesKey'];
        $headers = ['HTTP_X_TRANSPORT_KEY' => $key['header']];

        if ($csrfToken !== null) {
            $headers['HTTP_X_CSRF_TOKEN'] = $csrfToken;
        }

        $body = $data === [] ? '' : json_encode($key['envelope'], JSON_THROW_ON_ERROR);

        return $this->call($method, $path, [], [], [], $headers + ['CONTENT_TYPE' => 'application/json'], $body);
    }

    /** @return array<string, mixed> */
    private function responsePayload(TestResponse $response, string $method, string $path): array
    {
        $body = (new EncryptedTransportResponseReader)->read($response, $this->transportKey, $method, $path)['body'];

        return json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    }

    private function csrfToken(): string
    {
        $this->withSession(['_token' => 'test-csrf-token']);
        $response = $this->encryptedRequest('GET', '/api/v1/auth/csrf')->assertOk();
        $payload = $this->responsePayload($response, 'GET', '/api/v1/auth/csrf');

        return $payload['data']['csrfToken'];
    }

    private function createUser(string $username, string $fullName, StaffRole $role = StaffRole::Staff): User
    {
        $user = new User;
        $user->setUsername(new Username($username));
        $user->setFullName(new FullName($fullName));
        $user->password = 'CorrectHorseBatteryStaple!2026';
        $user->role = $role;
        $user->active = true;
        $user->save();

        return $user;
    }
}
