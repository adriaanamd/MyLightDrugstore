<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface BackupArtifactReader
{
    public function read(int $backupId): BackupDownload;
}
