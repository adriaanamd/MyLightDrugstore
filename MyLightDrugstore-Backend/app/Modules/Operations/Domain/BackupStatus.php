<?php

declare(strict_types=1);

namespace App\Modules\Operations\Domain;

enum BackupStatus: string
{
    case Queued = 'queued';
    case Completed = 'completed';
    case Failed = 'failed';
}
