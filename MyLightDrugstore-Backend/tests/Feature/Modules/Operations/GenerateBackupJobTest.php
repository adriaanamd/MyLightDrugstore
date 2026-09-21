<?php

declare(strict_types=1);

namespace Tests\Feature\Modules\Operations;

use App\Modules\Operations\Application\BackupArtifactGenerator;
use App\Modules\Operations\Infrastructure\Jobs\GenerateBackupJob;
use App\Modules\Operations\Infrastructure\Persistence\BackupJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

final class GenerateBackupJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_generation_records_a_generic_reason_and_rethrows_the_failure(): void
    {
        $backup = BackupJob::factory()->create();
        $generator = new class implements BackupArtifactGenerator
        {
            public function generate(int $backupId): void
            {
                throw new RuntimeException('database password must never be persisted');
            }
        };

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('database password must never be persisted');

        try {
            (new GenerateBackupJob($backup->getKey()))->handle($generator);
        } finally {
            $backup->refresh();

            $this->assertSame('failed', $backup->status->value);
            $this->assertSame('Backup generation failed.', $backup->failure_reason);
        }
    }
}
