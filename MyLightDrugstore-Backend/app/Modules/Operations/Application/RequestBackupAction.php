<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final class RequestBackupAction
{
    public function __construct(
        private readonly BackupJobCreator $creator,
        private readonly BackupJobDispatcher $dispatcher,
        private readonly BackupJobQuery $query,
        private readonly AuditEventRecorder $auditEvents,
    ) {}

    public function execute(RequestBackupCommand $command): BackupJobDetails
    {
        $job = $this->creator->create($command);
        $this->auditEvents->record(new AuditEvent(
            $command->requestedByUserId,
            'backup.requested',
            'backup',
            (string) $job->id,
        ));
        $this->dispatcher->dispatch($job->id);

        return $this->query->find($job->id) ?? $job;
    }
}
