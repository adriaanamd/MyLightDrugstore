<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Operations\Domain\BackupStatus;
use App\Modules\Operations\Infrastructure\Persistence\BackupJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BackupJob> */
final class BackupJobFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'requested_by_user_id' => User::factory(),
            'status' => BackupStatus::Queued,
            'requested_at' => now('UTC'),
        ];
    }
}
