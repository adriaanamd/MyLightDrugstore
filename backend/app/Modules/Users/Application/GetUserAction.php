<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final class GetUserAction
{
    public function __construct(private readonly UserAccountQuery $users) {}

    public function execute(int $userId): ?UserAccountItem
    {
        return $this->users->find($userId);
    }
}
