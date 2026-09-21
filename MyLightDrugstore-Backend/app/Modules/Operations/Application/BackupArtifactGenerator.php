<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface BackupArtifactGenerator
{
    public function generate(int $backupId): void;
}
