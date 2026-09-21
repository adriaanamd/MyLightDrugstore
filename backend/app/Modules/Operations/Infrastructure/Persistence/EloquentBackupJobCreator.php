<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Application\BackupJobCreator;
use App\Modules\Operations\Application\BackupJobDetails;
use App\Modules\Operations\Application\RequestBackupCommand;
use App\Modules\Operations\Domain\BackupStatus;

final class EloquentBackupJobCreator implements BackupJobCreator
{
    public function __construct(private readonly EloquentBackupJobMapper $mapper) {}

    public function create(RequestBackupCommand $command): BackupJobDetails
    {
        $job = BackupJob::query()->create([
            'requested_by_user_id' => $command->requestedByUserId,
            'status' => BackupStatus::Queued->value,
            'requested_at' => now('UTC'),
        ]);

        return $this->mapper->map($job);
    }
}
