import type { InventoryReportRow, ReportFilters } from "@/entities/report"
import { ReportFiltersForm } from "./report-filters"

export function InventoryReportWidget({
  rows,
  onFilter,
}: {
  rows: InventoryReportRow[]
  onFilter: (filters: ReportFilters) => void
}) {
  return (
    <section aria-label="Inventory report">
      <ReportFiltersForm
        prefix="Inventory"
        submitLabel="Apply inventory filters"
        onSubmit={onFilter}
      />
      <table>
        <caption>Current stock by medicine</caption>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Stock</th>
            <th>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.medicineId}>
              <td>{row.genericName ?? row.brandName ?? row.medicineId}</td>
              <td>{row.stockOnHand}</td>
              <td>{row.earliestExpiry ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
