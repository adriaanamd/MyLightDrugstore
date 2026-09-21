<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final class UpdateUserAction
{
    public function __construct(private readonly UserAccountUpdater $updater) {}

    public function execute(UpdateUserCommand $command): ?UserAccountItem
    {
        return $this->updater->update($command);
    }
}
