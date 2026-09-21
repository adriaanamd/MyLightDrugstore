<?php

declare(strict_types=1);

namespace App\Modules\Operations\Infrastructure\Persistence;

use Database\Factories\AuditEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use LogicException;

#[Fillable(['actor_user_id', 'event', 'subject_type', 'subject_id', 'metadata', 'occurred_at'])]
#[UseFactory(AuditEventFactory::class)]
final class AuditEvent extends Model
{
    /** @use HasFactory<AuditEventFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        self::updating(static function (): void {
            throw new LogicException('Audit events are append-only.');
        });
        self::deleting(static function (): void {
            throw new LogicException('Audit events are append-only.');
        });
    }

    public $timestamps = false;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'occurred_at' => 'immutable_datetime',
        ];
    }
}
