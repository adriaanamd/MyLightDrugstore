<?php

declare(strict_types=1);

namespace Tests\Unit\Modules\Operations;

use App\Modules\Operations\Infrastructure\BackupArtifactGenerator;
use Illuminate\Support\Facades\Config;
use LogicException;
use Tests\TestCase;

final class BackupArtifactGeneratorTest extends TestCase
{
    public function test_it_builds_an_artifact_path_from_a_nested_private_prefix(): void
    {
        Config::set('backups.path_prefix', 'private/backups');

        $this->assertSame(
            'private/backups/backup-42.json.enc',
            BackupArtifactGenerator::path(42),
        );
    }

    public function test_it_rejects_path_traversal_segments(): void
    {
        Config::set('backups.path_prefix', 'private/../public');

        $this->expectException(LogicException::class);
        BackupArtifactGenerator::path(42);
    }

    public function test_it_rejects_empty_path_segments(): void
    {
        Config::set('backups.path_prefix', 'private//backups');

        $this->expectException(LogicException::class);
        BackupArtifactGenerator::path(42);
    }
}
