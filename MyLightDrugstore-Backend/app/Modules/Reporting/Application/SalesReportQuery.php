<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Application;

interface SalesReportQuery
{
    public function summarize(SalesReportFilters $filters): SalesReport;
}
