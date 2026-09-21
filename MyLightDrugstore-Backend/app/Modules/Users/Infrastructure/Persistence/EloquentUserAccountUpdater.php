<?php

declare(strict_types=1);

namespace App\Modules\Users\Infrastructure\Persistence;

use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Users\Application\UpdateUserCommand;
use App\Modules\Users\Application\UserAccountItem;
use App\Modules\Users\Application\UserAccountUpdater;

final class EloquentUserAccountUpdater implements UserAccountUpdater
{
    public function __construct(private readonly EloquentUserAccountMapper $mapper) {}

    public function update(UpdateUserCommand $command): ?UserAccountItem
    {
        $user = User::query()->find($command->userId);

        if ($user === null) {
            return null;
        }

        if (array_key_exists('fullName', $command->changes)) {
            $user->setFullName(new FullName($command->changes['fullName']));
        }

        if (array_key_exists('role', $command->changes)) {
            $user->role = $command->changes['role']->value;
        }

        if (array_key_exists('active', $command->changes)) {
            $user->active = $command->changes['active'];
        }

        $user->save();

        return $this->mapper->map($user);
    }
}
