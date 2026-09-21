<?php

declare(strict_types=1);

namespace App\Modules\Operations\Domain;

use RuntimeException;

final class BackupNotReady extends RuntimeException {}
