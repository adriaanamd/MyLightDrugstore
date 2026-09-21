<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure;

use App\Modules\ModuleName;
use App\Modules\ModuleProvider;
use App\Modules\Operations\Application\AuditEventRecorder;
use App\Modules\Operations\Application\BackupArtifactGenerator as BackupArtifactGeneratorContract;
use App\Modules\Operations\Application\BackupArtifactReader;
use App\Modules\Operations\Application\BackupJobCreator;
use App\Modules\Operations\Application\BackupJobDispatcher;
use App\Modules\Operations\Application\BackupJobQuery;
use App\Modules\Operations\Domain\Clock;
use App\Modules\Operations\Infrastructure\Persistence\EloquentAuditEventRecorder;
use App\Modules\Operations\Infrastructure\Persistence\EloquentBackupArtifactReader;
use App\Modules\Operations\Infrastructure\Persistence\EloquentBackupJobCreator;
use App\Modules\Operations\Infrastructure\Persistence\EloquentBackupJobQuery;
use Illuminate\Contracts\Container\Container;

final class OperationsModuleProvider implements ModuleProvider
{
    public function module(): ModuleName
    {
        return ModuleName::Operations;
    }

    public function register(Container $container): void
    {
        $container->bind(Clock::class, SystemClock::class);
        $container->bind(BackupArtifactGeneratorContract::class, BackupArtifactGenerator::class);
        $container->bind(BackupArtifactReader::class, EloquentBackupArtifactReader::class);
        $container->bind(BackupJobCreator::class, EloquentBackupJobCreator::class);
        $container->bind(BackupJobDispatcher::class, LaravelBackupJobDispatcher::class);
        $container->bind(BackupJobQuery::class, EloquentBackupJobQuery::class);
        $container->bind(AuditEventRecorder::class, EloquentAuditEventRecorder::class);
    }
}
