<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Sales\Infrastructure\Persistence\Sale;
use App\Modules\Sales\Infrastructure\Persistence\SaleCancellation;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SaleCancellation> */
final class SaleCancellationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'sale_id' => Sale::factory(),
            'actor_user_id' => User::factory(),
            'reason' => 'entered_in_error',
            'cancelled_at' => now('UTC'),
        ];
    }
}
