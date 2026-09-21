<?php

declare(strict_types=1);

namespace App\Modules\Operations\Presentation;

use App\Modules\Operations\Application\BackupJobDetails;

final readonly class BackupResource
{
    public function __construct(private BackupJobDetails $job) {}

    /** @return array<string, int|string|null> */
    public function toArray(): array
    {
        return [
            'id' => $this->job->id,
            'status' => $this->job->status->value,
            'requestedAt' => $this->job->requestedAt,
            'completedAt' => $this->job->completedAt,
            'size' => $this->job->size,
        ];
    }
}
