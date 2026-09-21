<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface BackupJobQuery
{
    public function find(int $backupId): ?BackupJobDetails;
}
