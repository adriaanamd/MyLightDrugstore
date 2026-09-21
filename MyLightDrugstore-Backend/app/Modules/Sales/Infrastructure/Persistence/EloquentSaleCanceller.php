<?php

declare(strict_types=1);

namespace App\Modules\Sales\Infrastructure\Persistence;

use App\Modules\Inventory\Application\InventoryStockRestorer;
use App\Modules\Inventory\Application\RestoreSaleItemStockCommand;
use App\Modules\Inventory\Domain\SaleStockRestorationType;
use App\Modules\Sales\Application\CancelSaleCommand;
use App\Modules\Sales\Application\SaleCanceller;
use App\Modules\Sales\Application\SaleDetails;
use App\Modules\Sales\Application\SaleDetailsQuery;
use App\Modules\Sales\Domain\SaleNotEditableException;
use Illuminate\Support\Facades\DB;
use LogicException;

final class EloquentSaleCanceller implements SaleCanceller
{
    public function __construct(
        private readonly InventoryStockRestorer $inventoryStockRestorer,
        private readonly SaleDetailsQuery $saleDetailsQuery,
    ) {}

    public function cancel(CancelSaleCommand $command): SaleDetails
    {
        return DB::transaction(function () use ($command): SaleDetails {
            $sale = Sale::query()
                ->whereKey($command->saleId)
                ->lockForUpdate()
                ->firstOrFail();
            $state = $sale->getAttribute('state');
            $paymentStatus = $sale->getAttribute('payment_status');

            if (! is_string($state) || ! is_string($paymentStatus)) {
                throw new LogicException('The sale persistence model contains invalid state data.');
            }

            if ($state === 'cancelled' && $paymentStatus === 'unpaid') {
                if (SaleCancellation::query()->where('sale_id', $command->saleId)->exists()) {
                    return $this->findSaleDetails($command->saleId);
                }

                throw new SaleNotEditableException;
            }

            if ($state !== 'open' || $paymentStatus !== 'unpaid') {
                throw new SaleNotEditableException;
            }

            $saleItems = SaleItem::query()
                ->where('sale_id', $command->saleId)
                ->where('state', 'active')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($saleItems as $saleItem) {
                $saleItemId = $saleItem->getKey();
                $medicineId = $saleItem->getAttribute('medicine_id');
                $quantity = $saleItem->getAttribute('quantity');

                if (! is_int($saleItemId) || ! is_int($medicineId) || ! is_int($quantity)) {
                    throw new LogicException('The sale item persistence model contains invalid stock data.');
                }

                $this->inventoryStockRestorer->restoreSaleItemStock(new RestoreSaleItemStockCommand(
                    $command->actorUserId,
                    $command->saleId,
                    $saleItemId,
                    $medicineId,
                    $quantity,
                    SaleStockRestorationType::SaleCancellation,
                ));

                $saleItem->setAttribute('state', 'cancelled');
                $saleItem->save();
            }

            $cancelledAt = now('UTC');
            SaleCancellation::query()->create([
                'sale_id' => $command->saleId,
                'actor_user_id' => $command->actorUserId,
                'reason' => $command->reason,
                'cancelled_at' => $cancelledAt,
            ]);
            $sale->setAttribute('state', 'cancelled');
            $sale->save();

            $saleDetails = $this->findSaleDetails($command->saleId);
            $cancellation = $saleDetails->cancellation;

            if ($cancellation === null) {
                throw new LogicException('The sale cancellation could not be reloaded.');
            }

            return $saleDetails;
        });
    }

    private function findSaleDetails(int $saleId): SaleDetails
    {
        $sale = $this->saleDetailsQuery->find($saleId);

        if ($sale === null) {
            throw new LogicException('The updated sale could not be reloaded.');
        }

        return $sale;
    }
}
