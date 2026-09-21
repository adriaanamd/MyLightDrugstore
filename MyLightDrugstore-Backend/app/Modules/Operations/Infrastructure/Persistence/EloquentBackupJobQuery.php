<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Application\BackupJobDetails;
use App\Modules\Operations\Application\BackupJobQuery;

final class EloquentBackupJobQuery implements BackupJobQuery
{
    public function __construct(private readonly EloquentBackupJobMapper $mapper) {}

    public function find(int $backupId): ?BackupJobDetails
    {
        $job = BackupJob::query()->find($backupId);

        return $job === null ? null : $this->mapper->map($job);
    }
}
