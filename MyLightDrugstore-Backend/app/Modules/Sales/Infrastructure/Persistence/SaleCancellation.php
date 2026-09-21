<?php

declare(strict_types=1);

namespace App\Modules\Sales\Infrastructure\Persistence;

use App\Modules\Identity\Infrastructure\Persistence\User;
use Database\Factories\SaleCancellationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['sale_id', 'actor_user_id', 'reason', 'cancelled_at'])]
#[UseFactory(SaleCancellationFactory::class)]
final class SaleCancellation extends Model
{
    public const CREATED_AT = 'cancelled_at';

    public const UPDATED_AT = null;

    /** @use HasFactory<SaleCancellationFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['cancelled_at' => 'immutable_datetime'];
    }

    protected static function booted(): void
    {
        self::updating(static function (self $cancellation): never {
            throw new LogicException('Sale cancellation records are append-only.');
        });

        self::deleting(static function (self $cancellation): never {
            throw new LogicException('Sale cancellation records are append-only.');
        });
    }

    /** @return BelongsTo<Sale, $this> */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
