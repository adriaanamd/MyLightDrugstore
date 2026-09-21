<?php

declare(strict_types=1);

namespace App\Modules\Users\Application;

final class CreateUserAction
{
    public function __construct(private readonly UserAccountCreator $creator) {}

    public function execute(CreateUserCommand $command): UserAccountItem
    {
        return $this->creator->create($command);
    }
}
