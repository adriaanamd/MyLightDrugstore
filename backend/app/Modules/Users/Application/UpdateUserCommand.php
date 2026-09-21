<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

use App\Modules\Identity\Domain\Users\StaffRole;

final readonly class UpdateUserCommand
{
    /**
     * @param  array{fullName?: string, role?: StaffRole, active?: bool}  $changes
     */
    public function __construct(public int $userId, public array $changes) {}
}
