<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Domain;

enum SaleStockRestorationType: string
{
    case SaleItemRemoval = 'sale_item_removal';
    case SaleCancellation = 'sale_cancellation';
}
