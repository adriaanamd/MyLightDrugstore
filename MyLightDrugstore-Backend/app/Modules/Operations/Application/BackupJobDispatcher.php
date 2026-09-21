<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface BackupJobDispatcher
{
    public function dispatch(int $backupId): void;
}
