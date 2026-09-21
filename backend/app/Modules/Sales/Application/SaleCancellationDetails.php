<?php

declare(strict_types=1);

namespace App\Modules\Sales\Application;

final readonly class SaleCancellationDetails
{
    public function __construct(
        public int $cancelledBy,
        public string $reason,
        public string $cancelledAt,
    ) {}

    /** @return array{cancelledBy: int, reason: string, cancelledAt: string} */
    public function toArray(): array
    {
        return [
            'cancelledBy' => $this->cancelledBy,
            'reason' => $this->reason,
            'cancelledAt' => $this->cancelledAt,
        ];
    }
}
