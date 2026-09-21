<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Presentation;

use App\Modules\Reporting\Application\GetSalesReportAction;
use Illuminate\Http\JsonResponse;

final class SalesReportController
{
    public function __invoke(SalesReportRequest $request, GetSalesReportAction $getSalesReport): JsonResponse
    {
        $report = $getSalesReport->execute($request->filters());

        return response()->json([
            'data' => [
                'from' => $report->from,
                'to' => $report->to,
                'saleCount' => $report->saleCount,
                'grossSales' => $report->grossSales,
                'paidSaleCount' => $report->paidSaleCount,
                'paidGrossSales' => $report->paidGrossSales,
                'cancelledSaleCount' => $report->cancelledSaleCount,
            ],
        ]);
    }
}
