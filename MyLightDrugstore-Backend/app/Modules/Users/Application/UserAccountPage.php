<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

/** @phpstan-type UserAccountList list<UserAccountItem> */
final readonly class UserAccountPage
{
    /** @param UserAccountList $items */
    public function __construct(
        public array $items,
        public int $page,
        public int $perPage,
        public int $total,
    ) {}
}
