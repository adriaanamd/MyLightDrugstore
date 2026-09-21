<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

use App\Modules\Identity\Domain\Users\StaffRole;

final readonly class CreateUserCommand
{
    public function __construct(
        public string $username,
        public string $fullName,
        public string $password,
        public StaffRole $role,
    ) {}
}
