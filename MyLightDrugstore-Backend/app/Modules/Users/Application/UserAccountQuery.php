<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

interface UserAccountQuery
{
    public function search(UserListFilters $filters): UserAccountPage;

    public function find(int $userId): ?UserAccountItem;
}
