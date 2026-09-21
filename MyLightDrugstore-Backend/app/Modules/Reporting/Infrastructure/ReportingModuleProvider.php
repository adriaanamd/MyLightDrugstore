<?php

declare(strict_types=1);

namespace App\Modules\Reporting\Infrastructure;

use App\Modules\ModuleName;
use App\Modules\ModuleProvider;
use App\Modules\Reporting\Application\SalesReportQuery;
use App\Modules\Reporting\Infrastructure\Persistence\EloquentSalesReportQuery;
use Illuminate\Contracts\Container\Container;

final class ReportingModuleProvider implements ModuleProvider
{
    public function module(): ModuleName
    {
        return ModuleName::Reporting;
    }

    public function register(Container $container): void
    {
        $container->bind(SalesReportQuery::class, EloquentSalesReportQuery::class);
    }
}
