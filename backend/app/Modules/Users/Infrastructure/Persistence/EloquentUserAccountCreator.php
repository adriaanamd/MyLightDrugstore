<?php

declare(strict_types=1);

namespace App\Modules\Users\Infrastructure\Persistence;

use App\Modules\Identity\Domain\Users\FullName;
use App\Modules\Identity\Domain\Users\Username;
use App\Modules\Identity\Infrastructure\Persistence\User;
use App\Modules\Security\Application\UsernameLookupDigest;
use App\Modules\Users\Application\CreateUserCommand;
use App\Modules\Users\Application\UserAccountCreator;
use App\Modules\Users\Application\UserAccountItem;
use App\Modules\Users\Domain\UsernameAlreadyExists;
use Illuminate\Support\Facades\DB;

final class EloquentUserAccountCreator implements UserAccountCreator
{
    public function __construct(
        private readonly UsernameLookupDigest $usernameLookupDigest,
        private readonly EloquentUserAccountMapper $mapper,
    ) {}

    public function create(CreateUserCommand $command): UserAccountItem
    {
        $username = new Username($command->username);
        $fullName = new FullName($command->fullName);
        $digest = $this->usernameLookupDigest->digest($username->value);

        if (User::query()->where('username_lookup_digest', $digest)->exists()) {
            throw new UsernameAlreadyExists;
        }

        return DB::transaction(function () use ($username, $fullName, $command): UserAccountItem {
            $user = new User;
            $user->setUsername($username);
            $user->setFullName($fullName);
            $user->password = $command->password;
            $user->role = $command->role->value;
            $user->active = true;
            $user->save();

            return $this->mapper->map($user);
        });
    }
}
