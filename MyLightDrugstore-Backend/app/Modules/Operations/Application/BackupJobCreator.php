<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

interface BackupJobCreator
{
    public function create(RequestBackupCommand $command): BackupJobDetails;
}
