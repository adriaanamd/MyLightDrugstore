<?php

declare(strict_types=1);

namespace App\Modules\Sales\Application;

final readonly class CancelSaleCommand
{
    public function __construct(
        public int $actorUserId,
        public int $saleId,
        public string $reason,
    ) {}
}
