<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final readonly class RequestBackupCommand
{
    public function __construct(public int $requestedByUserId) {}
}
