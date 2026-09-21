<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Operations\Infrastructure\Persistence\AuditEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AuditEvent> */
final class AuditEventFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'actor_user_id' => User::factory(),
            'event' => 'backup.requested',
            'subject_type' => 'backup',
            'subject_id' => (string) fake()->numberBetween(1, 999),
            'metadata' => [],
            'occurred_at' => now('UTC'),
        ];
    }
}
