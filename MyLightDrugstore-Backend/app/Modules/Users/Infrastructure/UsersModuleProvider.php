<?php

declare(strict_types=1);

namespace App\Modules\Users\Infrastructure;

use App\Modules\ModuleName;
use App\Modules\ModuleProvider;
use App\Modules\Users\Application\UserAccountCreator;
use App\Modules\Users\Application\UserAccountQuery;
use App\Modules\Users\Application\UserAccountUpdater;
use App\Modules\Users\Infrastructure\Persistence\EloquentUserAccountCreator;
use App\Modules\Users\Infrastructure\Persistence\EloquentUserAccountQuery;
use App\Modules\Users\Infrastructure\Persistence\EloquentUserAccountUpdater;
use Illuminate\Contracts\Container\Container;

final class UsersModuleProvider implements ModuleProvider
{
    public function module(): ModuleName
    {
        return ModuleName::Users;
    }

    public function register(Container $container): void
    {
        $container->bind(UserAccountQuery::class, EloquentUserAccountQuery::class);
        $container->bind(UserAccountCreator::class, EloquentUserAccountCreator::class);
        $container->bind(UserAccountUpdater::class, EloquentUserAccountUpdater::class);
    }
}
