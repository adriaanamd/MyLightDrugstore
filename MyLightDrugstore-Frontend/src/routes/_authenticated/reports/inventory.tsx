import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createReportApi, mapInventoryReportResponse } from "@/entities/report"
import { getAppServices } from "@/app/providers/app-services"
import type { ReportFilters } from "@/entities/report"
import { InventoryReportPage } from "@/pages/reports/inventory-report-page"

const reportApi = createReportApi(getAppServices().transport)

export const Route = createFileRoute("/_authenticated/reports/inventory")({
  loader: async () =>
    mapInventoryReportResponse((await reportApi.inventory()).data),
  component: InventoryReportRoute,
})

function InventoryReportRoute() {
  const router = useRouter()
  const report = Route.useLoaderData()
  const filter = async (filters: ReportFilters) => {
    await reportApi.inventory(filters)
    await router.invalidate()
  }
  return <InventoryReportPage rows={report.rows} onFilter={filter} />
}
