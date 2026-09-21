<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final class DownloadBackupAction
{
    public function __construct(
        private readonly BackupArtifactReader $reader,
        private readonly AuditEventRecorder $auditEvents,
    ) {}

    public function execute(int $backupId, int $actorUserId): BackupDownload
    {
        $download = $this->reader->read($backupId);
        $this->auditEvents->record(new AuditEvent(
            $actorUserId,
            'backup.downloaded',
            'backup',
            (string) $backupId,
        ));

        return $download;
    }
}
