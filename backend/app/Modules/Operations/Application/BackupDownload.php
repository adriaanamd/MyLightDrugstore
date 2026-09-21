<?php

declare(strict_types=1);

namespace App\Modules\Operations\Application;

final readonly class BackupDownload
{
    public function __construct(public string $contents, public string $filename) {}
}
