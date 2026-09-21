<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Jobs;

use App\Modules\Operations\Application\BackupArtifactGenerator;
use App\Modules\Operations\Domain\BackupStatus;
use App\Modules\Operations\Infrastructure\Persistence\BackupJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

final class GenerateBackupJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public function __construct(public readonly int $backupId) {}

    public function handle(BackupArtifactGenerator $generator): void
    {
        try {
            $generator->generate($this->backupId);
        } catch (Throwable $exception) {
            BackupJob::query()->whereKey($this->backupId)->update([
                'status' => BackupStatus::Failed->value,
                'failure_reason' => 'Backup generation failed.',
            ]);

            throw $exception;
        }
    }
}
