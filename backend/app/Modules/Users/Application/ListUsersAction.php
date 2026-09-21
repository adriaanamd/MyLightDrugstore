<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final class ListUsersAction
{
    public function __construct(private readonly UserAccountQuery $users) {}

    public function execute(UserListFilters $filters): UserAccountPage
    {
        return $this->users->search($filters);
    }
}
