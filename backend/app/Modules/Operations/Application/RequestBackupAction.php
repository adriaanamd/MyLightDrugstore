<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final class RequestBackupAction
{
    public function __construct(
        private readonly BackupJobCreator $creator,
        private readonly BackupJobDispatcher $dispatcher,
        private readonly BackupJobQuery $query,
    ) {}

    public function execute(RequestBackupCommand $command): BackupJobDetails
    {
        $job = $this->creator->create($command);
        $this->dispatcher->dispatch($job->id);

        return $this->query->find($job->id) ?? $job;
    }
}
