<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

use App\Modules\Operations\Domain\BackupStatus;

final readonly class BackupJobDetails
{
    public function __construct(
        public int $id,
        public BackupStatus $status,
        public string $requestedAt,
        public ?string $completedAt,
        public ?int $size,
    ) {}
}
