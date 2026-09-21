<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Reporting;

use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Sales\Infrastructure\Persistence\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Testing\TestResponse;
use Tests\Support\EncryptedTransportRequestBuilder;
use Tests\Support\EncryptedTransportResponseReader;
use Tests\TestCase;

final class SalesReportEndpointTest extends TestCase
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
        $this->actingAs($this->createUser(), 'web');
    }

    public function test_it_reports_inclusive_date_range_totals_by_sale_state_and_payment_status(): void
    {
        $user = User::query()->firstOrFail();
        Sale::factory()->create([
            'created_by_user_id' => $user->getKey(),
            'state' => 'completed',
            'payment_status' => 'paid',
            'total' => '12.50',
            'created_at' => '2026-09-18 11:00:00',
        ]);
        Sale::factory()->create([
            'created_by_user_id' => $user->getKey(),
            'state' => 'completed',
            'payment_status' => 'paid',
            'total' => '7.25',
            'created_at' => '2026-09-19 11:00:00',
        ]);
        Sale::factory()->create([
            'created_by_user_id' => $user->getKey(),
            'state' => 'cancelled',
            'payment_status' => 'unpaid',
            'total' => '99.99',
            'created_at' => '2026-09-19 12:00:00',
        ]);
        Sale::factory()->create([
            'created_by_user_id' => $user->getKey(),
            'state' => 'open',
            'payment_status' => 'unpaid',
            'total' => '4.00',
            'created_at' => '2026-09-20 00:00:00',
        ]);

        $payload = $this->responsePayload(
            $this->encryptedRequest('GET', '/api/v1/reports/sales?from=2026-09-18&to=2026-09-19'),
            'GET',
            '/api/v1/reports/sales?from=2026-09-18&to=2026-09-19',
        );

        $this->assertSame([
            'from' => '2026-09-18',
            'to' => '2026-09-19',
            'saleCount' => 3,
            'grossSales' => '19.75',
            'paidSaleCount' => 2,
            'paidGrossSales' => '19.75',
            'cancelledSaleCount' => 1,
        ], $payload['data']);
    }

    public function test_staff_can_read_reports(): void
    {
        $payload = $this->responsePayload(
            $this->encryptedRequest('GET', '/api/v1/reports/sales'),
            'GET',
            '/api/v1/reports/sales',
        );

        $this->assertSame(0, $payload['data']['saleCount']);
        $this->assertSame('0.00', $payload['data']['grossSales']);
    }

    public function test_it_validates_report_date_ranges(): void
    {
        $path = '/api/v1/reports/sales?from=2026-09-20&to=2026-09-19';
        $response = $this->encryptedRequest('GET', $path)->assertUnprocessable();
        $payload = $this->responsePayload($response, 'GET', $path);

        $this->assertSame('validation_failed', $payload['error']['code']);
        $this->assertArrayHasKey('to', $payload['error']['details']);
    }

    private function createUser(): User
    {
        $user = new User;
        $user->setUsername(new Username('reports.staff'));
        $user->setFullName(new FullName('Reports Staff'));
        $user->password = 'CorrectHorseBatteryStaple!2026';
        $user->role = StaffRole::Staff;
        $user->active = true;
        $user->save();

        return $user;
    }

    /** @return array<string, mixed> */
    private function responsePayload(TestResponse $response, string $method, string $path): array
    {
        $body = (new EncryptedTransportResponseReader)->read($response, $this->transportKey, $method, $path)['body'];

        return json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    }

    private function encryptedRequest(string $method, string $path): TestResponse
    {
        $key = (new EncryptedTransportRequestBuilder)->buildBodyless();
        $this->transportKey = $key['aesKey'];

        return $this->call($method, $path, [], [], [], [
            'HTTP_X_TRANSPORT_KEY' => $key['header'],
        ]);
    }
}
