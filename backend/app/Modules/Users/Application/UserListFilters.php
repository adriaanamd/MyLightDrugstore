<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final readonly class UserListFilters
{
    public function __construct(
        public ?bool $active,
        public int $page,
        public int $perPage,
    ) {}
}
