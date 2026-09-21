<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final readonly class UserAccountItem
{
    public function __construct(
        public int $id,
        public string $username,
        public string $fullName,
        public string $role,
        public bool $active,
        public string $createdAt,
        public string $updatedAt,
    ) {}
}
