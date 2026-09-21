<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Operations;

use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Security\Application\UsernameLookupDigest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\Support\EncryptedTransportRequestBuilder;
use Tests\Support\EncryptedTransportResponseReader;
use Tests\TestCase;

final class BackupEndpointTest extends TestCase
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
        Storage::fake('local');
    }

    public function test_staff_can_request_a_completed_encrypted_backup_job(): void
    {
        $this->actingAs($this->createUser('backup.staff', 'Backup Staff'), 'web');
        $csrfToken = $this->csrfToken();

        $response = $this->encryptedRequest('POST', '/api/v1/backups', [], $csrfToken)->assertAccepted();
        $payload = $this->responsePayload($response, 'POST', '/api/v1/backups');
        $backup = $payload['data'];

        $this->assertIsInt($backup['id']);
        $this->assertSame('completed', $backup['status']);
        $this->assertGreaterThan(0, $backup['size']);
        $this->assertIsString($backup['completedAt']);
        $artifactPath = 'backups/backup-'.$backup['id'].'.json.enc';
        Storage::disk('local')->assertExists($artifactPath);
        $this->assertStringNotContainsString('backup.staff', Storage::disk('local')->get($artifactPath));
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $this->userId('backup.staff'),
            'event' => 'backup.requested',
            'subject_type' => 'backup',
            'subject_id' => (string) $backup['id'],
        ]);
    }

    public function test_only_an_admin_can_read_status_and_download_a_backup(): void
    {
        $staff = $this->createUser('backup.staff', 'Backup Staff');
        $this->actingAs($staff, 'web');
        $csrfToken = $this->csrfToken();
        $created = $this->encryptedRequest('POST', '/api/v1/backups', [], $csrfToken)->assertAccepted();
        $backupId = $this->responsePayload($created, 'POST', '/api/v1/backups')['data']['id'];

        $this->encryptedRequest('GET', '/api/v1/backups/'.$backupId)->assertForbidden();
        $this->encryptedRequest('GET', '/api/v1/backups/'.$backupId.'/download')->assertForbidden();

        $admin = $this->createUser('backup.admin', 'Backup Admin', StaffRole::Admin);
        $this->actingAs($admin, 'web');
        $status = $this->encryptedRequest('GET', '/api/v1/backups/'.$backupId)->assertOk();
        $statusPayload = $this->responsePayload($status, 'GET', '/api/v1/backups/'.$backupId);
        $this->assertSame($backupId, $statusPayload['data']['id']);
        $this->assertSame('completed', $statusPayload['data']['status']);

        $path = '/api/v1/backups/'.$backupId.'/download';
        $download = $this->encryptedRequest('GET', $path)->assertOk();
        $descriptor = (new EncryptedTransportResponseReader)->read($download, $this->transportKey, 'GET', $path);
        $this->assertSame('application/octet-stream', $descriptor['contentType']);
        $this->assertSame('base64', $descriptor['bodyEncoding']);
        $this->assertStringContainsString('attachment;', $descriptor['headers']['content-disposition']);
        $this->assertStringContainsString('backup-'.$backupId.'.json', $descriptor['headers']['content-disposition']);
        $this->assertDatabaseHas('audit_events', [
            'actor_user_id' => $admin->getKey(),
            'event' => 'backup.downloaded',
            'subject_type' => 'backup',
            'subject_id' => (string) $backupId,
        ]);
    }

    public function test_unknown_backup_ids_are_not_disclosed(): void
    {
        $this->actingAs($this->createUser('backup.admin', 'Backup Admin', StaffRole::Admin), 'web');

        $this->encryptedRequest('GET', '/api/v1/backups/999')->assertNotFound();
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

    private function userId(string $username): int
    {
        return User::query()
            ->where('username_lookup_digest', app(UsernameLookupDigest::class)->digest($username))
            ->value('id');
    }

    private function csrfToken(): string
    {
        $this->withSession(['_token' => 'test-csrf-token']);
        $response = $this->encryptedRequest('GET', '/api/v1/auth/csrf')->assertOk();

        return $this->responsePayload($response, 'GET', '/api/v1/auth/csrf')['data']['csrfToken'];
    }

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
}
