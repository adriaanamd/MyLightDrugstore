<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

interface UserAccountUpdater
{
    public function update(UpdateUserCommand $command): ?UserAccountItem;
}
