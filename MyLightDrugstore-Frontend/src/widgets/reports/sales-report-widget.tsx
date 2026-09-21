import type { ReportFilters, SalesReport } from "@/entities/report"
import { ReportFiltersForm } from "./report-filters"

export function SalesReportWidget({
  report,
  onFilter,
}: {
  report: SalesReport
  onFilter: (filters: ReportFilters) => void
}) {
  return (
    <section aria-label="Sales report">
      <ReportFiltersForm
        prefix="Sales"
        submitLabel="Apply sales filters"
        onSubmit={onFilter}
      />
      <dl>
        <div><dt>Sales count</dt><dd>{report.saleCount}</dd></div>
        <div><dt>Gross sales</dt><dd>{report.grossSales}</dd></div>
        <div><dt>Paid sales</dt><dd>{report.paidSaleCount}</dd></div>
        <div><dt>Paid gross sales</dt><dd>{report.paidGrossSales}</dd></div>
        <div><dt>Cancelled sales</dt><dd>{report.cancelledSaleCount}</dd></div>
      </dl>
    </section>
  )
}
