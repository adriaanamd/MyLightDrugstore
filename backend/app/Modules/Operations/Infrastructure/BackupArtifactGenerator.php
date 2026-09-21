<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure;

use App\Modules\Operations\Application\BackupArtifactGenerator as BackupArtifactGeneratorContract;
use App\Modules\Operations\Domain\BackupStatus;
use App\Modules\Operations\Infrastructure\Persistence\BackupJob;
use App\Modules\Security\Application\SensitiveDataProtector;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use JsonException;
use LogicException;

final class BackupArtifactGenerator implements BackupArtifactGeneratorContract
{
    public function __construct(private readonly SensitiveDataProtector $protector) {}

    public function generate(int $backupId): void
    {
        $snapshot = [
            'version' => 1,
            'generatedAt' => now('UTC')->format('Y-m-d\TH:i:s\Z'),
            'tables' => [],
        ];

        foreach ($this->tables() as $table) {
            $snapshot['tables'][$table] = DB::table($table)->get()->map(
                static fn (object $row): array => get_object_vars($row),
            )->all();
        }

        try {
            $plaintext = json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        } catch (JsonException $exception) {
            throw new LogicException('The backup snapshot could not be encoded.', previous: $exception);
        }

        $encoded = $this->protector->encrypt($plaintext, 'backups.artifact');
        $path = $this->path($backupId);

        if (! Storage::disk($this->disk())->put($path, $encoded)) {
            throw new LogicException('The backup artifact could not be stored.');
        }

        BackupJob::query()->whereKey($backupId)->update([
            'status' => BackupStatus::Completed->value,
            'completed_at' => now('UTC'),
            'artifact_size' => strlen($encoded),
        ]);
    }

    public static function path(int $backupId): string
    {
        $prefix = config('backups.path_prefix', 'backups');

        if (! is_string($prefix) || $prefix === '') {
            throw new LogicException('The backup path prefix must be a non-empty string.');
        }

        $normalizedPrefix = trim($prefix, '/');
        $segments = explode('/', $normalizedPrefix);

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || str_contains($segment, '\\')) {
                throw new LogicException('The backup path prefix contains an unsafe segment.');
            }
        }

        return $normalizedPrefix.'/backup-'.$backupId.'.json.enc';
    }

    private function disk(): string
    {
        $disk = config('backups.disk', 'local');

        if (! is_string($disk) || $disk === '') {
            throw new LogicException('The backup storage disk must be a non-empty string.');
        }

        return $disk;
    }

    /** @return list<string> */
    private function tables(): array
    {
        $tables = config('backups.tables', []);

        if (! is_array($tables) || ! array_is_list($tables) || array_filter($tables, 'is_string') !== $tables) {
            throw new LogicException('The backup table configuration must be a list of strings.');
        }

        return $tables;
    }
}
