<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final class GetBackupAction
{
    public function __construct(private readonly BackupJobQuery $query) {}

    public function execute(int $backupId): ?BackupJobDetails
    {
        return $this->query->find($backupId);
    }
}
