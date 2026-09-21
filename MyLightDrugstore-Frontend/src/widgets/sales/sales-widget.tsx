import type { Sale } from "@/entities/sale"
import { SaleCartActions } from "@/features/sale-cart-actions"

export function SalesWidget({
  sales,
  onMarkPaid,
  onCancel,
}: {
  sales: Sale[]
  onMarkPaid: (id: string) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}) {
  if (sales.length === 0) return <p>No sales found.</p>

  return (
    <section aria-label="Sales list">
      {sales.map((sale) => (
        <article key={sale.id}>
          <h2>{sale.id}</h2>
          <p>Status: {sale.status}</p>
          <p>Total: {sale.total ?? 0}</p>
          <SaleCartActions
            sale={sale}
            onMarkPaid={() => onMarkPaid(sale.id)}
            onCancel={() => onCancel(sale.id)}
          />
        </article>
      ))}
    </section>
  )
}
