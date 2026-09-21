<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Application;

final readonly class SalesReport
{
    public function __construct(
        public ?string $from,
        public ?string $to,
        public int $saleCount,
        public string $grossSales,
        public int $paidSaleCount,
        public string $paidGrossSales,
        public int $cancelledSaleCount,
    ) {}
}
