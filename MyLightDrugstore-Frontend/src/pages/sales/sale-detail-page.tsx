import type { Sale } from "@/entities/sale"
import { SaleCartActions } from "@/features/sale-cart-actions"

export function SaleDetailPage({
  sale,
  onMarkPaid,
  onCancel,
}: {
  sale: Sale
  onMarkPaid: () => Promise<void> | void
  onCancel: () => Promise<void> | void
}) {
  return (
    <main>
      <h1>Sale {sale.id}</h1>
      <p>Status: {sale.status}</p>
      <p>Total: {sale.total ?? 0}</p>
      <SaleCartActions
        sale={sale}
        onMarkPaid={onMarkPaid}
        onCancel={onCancel}
      />
    </main>
  )
}
