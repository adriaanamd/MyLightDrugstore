<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Reporting;

use App\Modules\Catalog\Infrastructure\Persistence\Medicine;
use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Inventory\Infrastructure\Persistence\InventoryLot;
use App\Modules\Inventory\Infrastructure\Persistence\InventoryReceipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Testing\TestResponse;
use Tests\Support\EncryptedTransportRequestBuilder;
use Tests\Support\EncryptedTransportResponseReader;
use Tests\TestCase;

final class InventoryReportEndpointTest extends TestCase
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
        Config::set('inventory.low_stock_threshold', 30);
        $this->actingAs($this->createUser(), 'web');
    }

    public function test_it_reuses_inventory_filters_and_returns_current_stock_rows_for_reports(): void
    {
        $actor = User::query()->firstOrFail();
        $lowStock = Medicine::factory()->create(['generic_name' => 'Report low stock']);
        $highStock = Medicine::factory()->create(['generic_name' => 'Report high stock']);
        $this->addLot($lowStock, $actor, 5, '2026-12-01');
        $this->addLot($highStock, $actor, 30, '2026-11-01');

        $path = '/api/v1/reports/inventory?lowStock=true&expiresBefore=2026-12-01';
        $payload = $this->responsePayload($this->encryptedRequest('GET', $path), 'GET', $path);

        $this->assertSame(['page' => 1, 'perPage' => 25, 'total' => 1], $payload['meta']);
        $this->assertSame($lowStock->getKey(), $payload['data'][0]['medicineId']);
        $this->assertSame(5, $payload['data'][0]['stockOnHand']);
        $this->assertTrue($payload['data'][0]['lowStock']);
        $this->assertSame('2026-12-01', $payload['data'][0]['earliestExpiry']);
    }

    public function test_it_rejects_unknown_inventory_report_filters(): void
    {
        $path = '/api/v1/reports/inventory?unexpected=true';
        $response = $this->encryptedRequest('GET', $path)->assertUnprocessable();
        $payload = $this->responsePayload($response, 'GET', $path);

        $this->assertSame('validation_failed', $payload['error']['code']);
        $this->assertArrayHasKey('unexpected', $payload['error']['details']);
    }

    private function createUser(): User
    {
        $user = new User;
        $user->setUsername(new Username('inventory.reports'));
        $user->setFullName(new FullName('Inventory Reports'));
        $user->password = 'CorrectHorseBatteryStaple!2026';
        $user->role = StaffRole::Staff;
        $user->active = true;
        $user->save();

        return $user;
    }

    private function addLot(Medicine $medicine, User $actor, int $quantity, string $expiresAt): void
    {
        $receipt = InventoryReceipt::query()->create([
            'actor_user_id' => $actor->getKey(),
            'received_at' => '2026-09-18T02:00:00Z',
        ]);
        InventoryLot::query()->create([
            'receipt_id' => $receipt->getKey(),
            'medicine_id' => $medicine->getKey(),
            'received_at' => '2026-09-18T02:00:00Z',
            'expires_at' => $expiresAt,
            'quantity_received' => $quantity,
            'quantity_remaining' => $quantity,
        ]);
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
