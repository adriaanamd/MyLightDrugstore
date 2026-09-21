<?php

declare(strict_types=1);

use App\Modules\Reporting\Presentation\InventoryReportController;
use App\Modules\Reporting\Presentation\SalesReportController;
use Illuminate\Support\Facades\Route;

Route::get('/reports/inventory', InventoryReportController::class)
    ->middleware('auth:web')
    ->name('api.v1.reports.inventory');
Route::get('/reports/sales', SalesReportController::class)
    ->middleware('auth:web')
    ->name('api.v1.reports.sales');
