<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use App\Modules\Operations\Domain\BackupStatus;
use Database\Factories\BackupJobFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['requested_by_user_id', 'status', 'requested_at', 'completed_at', 'artifact_size', 'failure_reason'])]
#[UseFactory(BackupJobFactory::class)]
final class BackupJob extends Model
{
    /** @use HasFactory<BackupJobFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => BackupStatus::class,
            'requested_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
            'artifact_size' => 'integer',
        ];
    }
}
