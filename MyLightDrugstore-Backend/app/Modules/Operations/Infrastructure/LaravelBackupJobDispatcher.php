<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure;

use App\Modules\Operations\Application\BackupJobDispatcher;
use App\Modules\Operations\Infrastructure\Jobs\GenerateBackupJob;

final class LaravelBackupJobDispatcher implements BackupJobDispatcher
{
    public function dispatch(int $backupId): void
    {
        GenerateBackupJob::dispatch($backupId);
    }
}
