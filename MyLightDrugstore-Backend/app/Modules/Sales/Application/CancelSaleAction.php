<?php

declare(strict_types=1);

namespace App\Modules\Sales\Application;

final class CancelSaleAction
{
    public function __construct(private readonly SaleCanceller $saleCanceller) {}

    public function execute(CancelSaleCommand $command): SaleDetails
    {
        return $this->saleCanceller->cancel($command);
    }
}
