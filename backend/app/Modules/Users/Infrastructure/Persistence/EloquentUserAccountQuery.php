<?php

declare(strict_types=1);

namespace App\Modules\Users\Infrastructure\Persistence;

use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Users\Application\UserAccountItem;
use App\Modules\Users\Application\UserAccountPage;
use App\Modules\Users\Application\UserAccountQuery;
use App\Modules\Users\Application\UserListFilters;

final class EloquentUserAccountQuery implements UserAccountQuery
{
    public function __construct(private readonly EloquentUserAccountMapper $mapper) {}

    public function search(UserListFilters $filters): UserAccountPage
    {
        $query = User::query();

        if ($filters->active !== null) {
            $query->where('active', $filters->active);
        }

        $paginated = $query
            ->orderBy('id')
            ->paginate($filters->perPage, ['*'], 'page', $filters->page);
        $items = [];

        foreach ($paginated->items() as $user) {
            $items[] = $this->mapper->map($user);
        }

        return new UserAccountPage(
            $items,
            $paginated->currentPage(),
            $paginated->perPage(),
            $paginated->total(),
        );
    }

    public function find(int $userId): ?UserAccountItem
    {
        $user = User::query()->find($userId);

        return $user === null ? null : $this->mapper->map($user);
    }
}
