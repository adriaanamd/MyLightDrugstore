<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final class DownloadBackupAction
{
    public function __construct(private readonly BackupArtifactReader $reader) {}

    public function execute(int $backupId): BackupDownload
    {
        return $this->reader->read($backupId);
    }
}
