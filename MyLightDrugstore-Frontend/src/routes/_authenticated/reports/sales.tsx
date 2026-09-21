import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createReportApi, mapSalesReportResponse } from "@/entities/report"
import { getAppServices } from "@/app/providers/app-services"
import type { ReportFilters } from "@/entities/report"
import { SalesReportPage } from "@/pages/reports/sales-report-page"

const reportApi = createReportApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/reports/sales")({
  loader: async () => mapSalesReportResponse((await reportApi.sales()).data),
  component: SalesReportRoute,
})

function SalesReportRoute() {
  const router = useRouter()
  const report = Route.useLoaderData()
  const filter = async (filters: ReportFilters) => {
    await reportApi.sales(filters)
    await router.invalidate()
  }
  return <SalesReportPage report={report} onFilter={filter} />
}
