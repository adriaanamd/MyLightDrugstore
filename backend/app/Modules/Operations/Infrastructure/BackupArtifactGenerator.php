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
    /** @var list<string> */
    private const array TABLES = [
        'users',
        'medicines',
        'inventory_receipts',
        'inventory_lots',
        'inventory_movements',
        'inventory_adjustments',
        'sales',
        'sale_items',
        'sales_idempotency_keys',
        'sale_cancellations',
        'backup_jobs',
    ];

    public function __construct(private readonly SensitiveDataProtector $protector) {}

    public function generate(int $backupId): void
    {
        $snapshot = [
            'version' => 1,
            'generatedAt' => now('UTC')->format('Y-m-d\TH:i:s\Z'),
            'tables' => [],
        ];

        foreach (self::TABLES as $table) {
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

        if (! Storage::disk('local')->put($path, $encoded)) {
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
        return 'backups/backup-'.$backupId.'.json.enc';
    }
}
