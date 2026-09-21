<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

interface UserAccountCreator
{
    public function create(CreateUserCommand $command): UserAccountItem;
}
