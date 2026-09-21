import type { ReportFilters, SalesReport } from "@/entities/report"
import { SalesReportWidget } from "@/widgets/reports"

export function SalesReportPage({
  report,
  onFilter,
}: {
  report: SalesReport
  onFilter: (filters: ReportFilters) => void
}) {
  return (
    <main>
      <header>
        <p>Operations</p>
        <h1>Sales report</h1>
      </header>
      <SalesReportWidget report={report} onFilter={onFilter} />
    </main>
  )
}
