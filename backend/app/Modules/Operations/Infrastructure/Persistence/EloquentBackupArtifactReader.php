<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Application\BackupArtifactReader;
use App\Modules\Operations\Application\BackupDownload;
use App\Modules\Operations\Domain\BackupNotReady;
use App\Modules\Operations\Domain\BackupStatus;
use App\Modules\Operations\Infrastructure\BackupArtifactGenerator;
use App\Modules\Security\Application\SensitiveDataProtector;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class EloquentBackupArtifactReader implements BackupArtifactReader
{
    public function __construct(private readonly SensitiveDataProtector $protector) {}

    public function read(int $backupId): BackupDownload
    {
        $job = BackupJob::query()->find($backupId);

        if ($job === null) {
            throw new NotFoundHttpException;
        }

        if ($job->getAttribute('status') !== BackupStatus::Completed) {
            throw new BackupNotReady;
        }

        $encoded = Storage::disk('local')->get(BackupArtifactGenerator::path($backupId));

        if (! is_string($encoded)) {
            throw new BackupNotReady;
        }

        return new BackupDownload(
            $this->protector->decrypt($encoded, 'backups.artifact'),
            'backup-'.$backupId.'.json',
        );
    }
}
