<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Sales;

use App\Modules\Catalog\Infrastructure\Persistence\Medicine;
use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\StaffRole;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Inventory\Infrastructure\Persistence\InventoryLot;
use App\Modules\Inventory\Infrastructure\Persistence\InventoryMovement;
use App\Modules\Inventory\Infrastructure\Persistence\InventoryReceipt;
use App\Modules\Sales\Infrastructure\Persistence\Sale;
use App\Modules\Sales\Infrastructure\Persistence\SaleItem;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use LogicException;
use Tests\Support\EncryptedTransportRequestBuilder;
use Tests\Support\EncryptedTransportResponseReader;
use Tests\TestCase;

final class SaleCancelEndpointTest extends TestCase
{
    use RefreshDatabase;

    private string $lastTransportKey = '';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('data_protection.keys', [
            'current' => [
                'key_id' => 'test-data-2026-01',
                'key_base64' => base64_encode(str_repeat('d', 32)),
            ],
            'retiring' => [],
        ]);
        config()->set('data_protection.username_lookup_key_base64', base64_encode(str_repeat('l', 32)));

        $this->actingAs($this->createUser(), 'web');
        $this->withSession(['_token' => 'test-csrf-token']);
    }

    public function test_it_cancels_an_unpaid_sale_with_audit_and_restores_stock_only_once(): void
    {
        [$sale, $lotIds, $saleItemIds] = $this->createSaleFixture();
        $saleId = $sale->getKey();

        if (! is_int($saleId)) {
            throw new LogicException('The sale fixture was created without a valid identifier.');
        }

        $path = '/api/v1/sales/'.$saleId.'/cancel';
        $response = $this->cancelSale($path, ['reason' => 'entered_in_error'])->assertOk();
        $payload = json_decode($this->responseBody($response, $path), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('cancelled', $payload['data']['state']);
        $this->assertSame('unpaid', $payload['data']['paymentStatus']);
        $this->assertSame('10.00', $payload['data']['total']);
        $this->assertSame('entered_in_error', $payload['data']['cancellation']['reason']);
        $this->assertSame(User::query()->firstOrFail()->getKey(), $payload['data']['cancellation']['cancelledBy']);
        $this->assertIsString($payload['data']['cancellation']['cancelledAt']);
        $this->assertSame(['cancelled', 'cancelled'], array_column($payload['data']['items'], 'state'));
        $this->assertDatabaseHas('sale_cancellations', [
            'sale_id' => $saleId,
            'actor_user_id' => User::query()->firstOrFail()->getKey(),
            'reason' => 'entered_in_error',
        ]);

        foreach ($lotIds as $lotId) {
            $this->assertDatabaseHas('inventory_lots', ['id' => $lotId, 'quantity_remaining' => 5]);
        }

        foreach ($saleItemIds as $saleItemId) {
            $this->assertDatabaseHas('sale_items', ['id' => $saleItemId, 'state' => 'cancelled']);
            $this->assertDatabaseHas('inventory_movements', [
                'sale_item_id' => $saleItemId,
                'movement_type' => 'sale_cancellation',
                'quantity_delta' => 2,
                'source_type' => 'sale',
                'source_id' => $saleId,
            ]);
        }

        $retryResponse = $this->cancelSale($path, ['reason' => 'entered_in_error'])->assertOk();

        $this->assertSame($payload, json_decode(
            $this->responseBody($retryResponse, $path),
            true,
            512,
            JSON_THROW_ON_ERROR,
        ));
        $this->assertDatabaseCount('sale_cancellations', 1);
        $this->assertDatabaseCount('inventory_movements', 4);
        $this->assertDatabaseHas('inventory_lots', ['id' => $lotIds[0], 'quantity_remaining' => 5]);
        $this->assertDatabaseHas('inventory_lots', ['id' => $lotIds[1], 'quantity_remaining' => 5]);
    }

    public function test_it_rejects_cancelling_a_paid_sale_without_restoring_stock(): void
    {
        [$sale, $lotIds] = $this->createSaleFixture();
        $sale->setAttribute('state', 'completed');
        $sale->setAttribute('payment_status', 'paid');
        $sale->save();
        $saleId = $sale->getKey();

        if (! is_int($saleId)) {
            throw new LogicException('The sale fixture was created without a valid identifier.');
        }

        $path = '/api/v1/sales/'.$saleId.'/cancel';
        $response = $this->cancelSale($path, ['reason' => 'entered_in_error'])->assertConflict();
        $payload = json_decode($this->responseBody($response, $path), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('conflict', $payload['error']['code']);
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'state' => 'completed', 'payment_status' => 'paid']);
        $this->assertDatabaseCount('sale_cancellations', 0);
        $this->assertDatabaseCount('inventory_movements', 2);

        foreach ($lotIds as $lotId) {
            $this->assertDatabaseHas('inventory_lots', ['id' => $lotId, 'quantity_remaining' => 3]);
        }
    }

    public function test_it_requires_a_reason_to_cancel_a_sale(): void
    {
        [$sale] = $this->createSaleFixture();
        $saleId = $sale->getKey();

        if (! is_int($saleId)) {
            throw new LogicException('The sale fixture was created without a valid identifier.');
        }

        $path = '/api/v1/sales/'.$saleId.'/cancel';
        $response = $this->cancelSale($path, [])->assertUnprocessable();
        $payload = json_decode($this->responseBody($response, $path), true, 512, JSON_THROW_ON_ERROR);

        $this->assertSame('validation_failed', $payload['error']['code']);
        $this->assertArrayHasKey('reason', $payload['error']['details']);
        $this->assertDatabaseCount('sale_cancellations', 0);
        $this->assertDatabaseHas('sales', ['id' => $saleId, 'state' => 'open', 'payment_status' => 'unpaid']);
    }

    private function createUser(): User
    {
        $user = new User;
        $user->setUsername(new Username('sales.cancel.staff'));
        $user->setFullName(new FullName('Sales Cancel Staff'));
        $user->password = 'CorrectHorseBatteryStaple!2026';
        $user->role = StaffRole::Staff;
        $user->active = true;
        $user->save();

        return $user;
    }

    /** @return array{Sale, array{int, int}, array{int, int}} */
    private function createSaleFixture(): array
    {
        $actor = User::query()->firstOrFail();
        $firstMedicine = Medicine::factory()->create(['unit_price' => '3.50']);
        $secondMedicine = Medicine::factory()->create(['unit_price' => '1.50']);
        $sale = Sale::factory()->create([
            'created_by_user_id' => $actor->getKey(),
            'state' => 'open',
            'payment_status' => 'unpaid',
            'total' => '10.00',
        ]);
        $saleId = $sale->getKey();

        if (! is_int($saleId)) {
            throw new LogicException('The sale fixture was created without a valid identifier.');
        }

        $firstItem = SaleItem::factory()->create([
            'sale_id' => $saleId,
            'medicine_id' => $firstMedicine->getKey(),
            'quantity' => 2,
            'unit_price' => '3.50',
            'line_total' => '7.00',
        ]);
        $secondItem = SaleItem::factory()->create([
            'sale_id' => $saleId,
            'medicine_id' => $secondMedicine->getKey(),
            'quantity' => 2,
            'unit_price' => '1.50',
            'line_total' => '3.00',
        ]);
        $firstItemId = $firstItem->getKey();
        $secondItemId = $secondItem->getKey();

        if (! is_int($firstItemId) || ! is_int($secondItemId)) {
            throw new LogicException('The sale item fixtures have invalid identifiers.');
        }

        $receivedAt = CarbonImmutable::now('UTC');
        $receipt = InventoryReceipt::query()->create([
            'actor_user_id' => $actor->getKey(),
            'received_at' => $receivedAt,
        ]);
        $receiptId = $receipt->getKey();

        if (! is_int($receiptId)) {
            throw new LogicException('The inventory receipt fixture has an invalid identifier.');
        }

        $firstLot = $this->createLot($receiptId, $firstMedicine, $receivedAt);
        $secondLot = $this->createLot($receiptId, $secondMedicine, $receivedAt);
        $firstLotId = $firstLot->getKey();
        $secondLotId = $secondLot->getKey();

        if (! is_int($firstLotId) || ! is_int($secondLotId)) {
            throw new LogicException('The inventory lot fixtures have invalid identifiers.');
        }

        foreach ([
            [$firstMedicine, $firstLotId, $firstItemId],
            [$secondMedicine, $secondLotId, $secondItemId],
        ] as [$medicine, $lotId, $saleItemId]) {
            InventoryMovement::query()->create([
                'medicine_id' => $medicine->getKey(),
                'inventory_lot_id' => $lotId,
                'sale_item_id' => $saleItemId,
                'actor_user_id' => $actor->getKey(),
                'movement_type' => 'sale',
                'quantity_delta' => -2,
                'source_type' => 'sale',
                'source_id' => $saleId,
                'occurred_at' => $receivedAt,
            ]);
        }

        return [$sale, [$firstLotId, $secondLotId], [$firstItemId, $secondItemId]];
    }

    private function createLot(int $receiptId, Medicine $medicine, CarbonImmutable $receivedAt): InventoryLot
    {
        return InventoryLot::query()->create([
            'receipt_id' => $receiptId,
            'medicine_id' => $medicine->getKey(),
            'received_at' => $receivedAt,
            'expires_at' => $receivedAt->addMonths(3),
            'quantity_received' => 5,
            'quantity_remaining' => 3,
        ]);
    }

    /** @param array<string, string> $payload */
    private function cancelSale(string $path, array $payload): TestResponse
    {
        $key = (new EncryptedTransportRequestBuilder)->build('POST', $path, $payload);
        $this->lastTransportKey = $key['aesKey'];

        return $this->call('POST', $path, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_CSRF_TOKEN' => 'test-csrf-token',
            'HTTP_X_TRANSPORT_KEY' => $key['header'],
        ], json_encode($key['envelope'], JSON_THROW_ON_ERROR));
    }

    private function responseBody(TestResponse $response, string $path): string
    {
        return (new EncryptedTransportResponseReader)
            ->read($response, $this->lastTransportKey, 'POST', $path)['body'];
    }
}
