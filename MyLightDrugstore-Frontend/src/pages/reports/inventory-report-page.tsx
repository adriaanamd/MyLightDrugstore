import type { InventoryReportRow, ReportFilters } from "@/entities/report"
import { InventoryReportWidget } from "@/widgets/reports"

export function InventoryReportPage({
  rows,
  onFilter,
}: {
  rows: InventoryReportRow[]
  onFilter: (filters: ReportFilters) => void
}) {
  return (
    <main>
      <header><p>Operations</p><h1>Inventory report</h1></header>
      <InventoryReportWidget rows={rows} onFilter={onFilter} />
    </main>
  )
}
