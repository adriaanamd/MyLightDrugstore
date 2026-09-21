<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Application;

use DateTimeImmutable;

final readonly class SalesReportFilters
{
    public function __construct(public ?DateTimeImmutable $from, public ?DateTimeImmutable $to) {}
}
