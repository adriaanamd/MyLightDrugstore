<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Infrastructure\Persistence;

use App\Modules\Reporting\Application\SalesReport;
use App\Modules\Reporting\Application\SalesReportFilters;
use App\Modules\Reporting\Application\SalesReportQuery;
use App\Modules\Sales\Domain\SaleAmount;
use App\Modules\Sales\Infrastructure\Persistence\Sale;
use DateTimeInterface;
use LogicException;

final class EloquentSalesReportQuery implements SalesReportQuery
{
    public function summarize(SalesReportFilters $filters): SalesReport
    {
        $query = Sale::query()->select(['state', 'payment_status', 'total']);

        if ($filters->from !== null) {
            $query->whereDate('created_at', '>=', $filters->from->format('Y-m-d'));
        }

        if ($filters->to !== null) {
            $query->whereDate('created_at', '<=', $filters->to->format('Y-m-d'));
        }

        $saleCount = 0;
        $paidSaleCount = 0;
        $cancelledSaleCount = 0;
        $grossSales = SaleAmount::zero();
        $paidGrossSales = SaleAmount::zero();

        foreach ($query->get() as $sale) {
            $total = $sale->getAttribute('total');

            if (! is_string($total)) {
                throw new LogicException('The sales report query returned an invalid total.');
            }

            $amount = SaleAmount::fromDecimal($total);
            $saleCount++;

            if ($sale->getAttribute('state') === 'completed') {
                $grossSales = $grossSales->add($amount);
            }

            if ($sale->getAttribute('payment_status') === 'paid') {
                $paidSaleCount++;
                $paidGrossSales = $paidGrossSales->add($amount);
            }

            if ($sale->getAttribute('state') === 'cancelled') {
                $cancelledSaleCount++;
            }
        }

        return new SalesReport(
            $this->date($filters->from),
            $this->date($filters->to),
            $saleCount,
            $grossSales->toDecimal(),
            $paidSaleCount,
            $paidGrossSales->toDecimal(),
            $cancelledSaleCount,
        );
    }

    private function date(?DateTimeInterface $date): ?string
    {
        return $date?->format('Y-m-d');
    }
}
