<?php

declare(strict_types=1);

namespace App\Modules\Sales\Application;

interface SaleCanceller
{
    public function cancel(CancelSaleCommand $command): SaleDetails;
}
