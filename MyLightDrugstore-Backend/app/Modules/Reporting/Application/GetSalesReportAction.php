<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Application;

final class GetSalesReportAction
{
    public function __construct(private readonly SalesReportQuery $query) {}

    public function execute(SalesReportFilters $filters): SalesReport
    {
        return $this->query->summarize($filters);
    }
}
