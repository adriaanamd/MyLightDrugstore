import type { Sale } from "@/entities/sale"
import { SaleCartActions } from "@/features/sale-cart-actions"

export function SaleCartPage({
  sale,
  onMarkPaid,
  onCancel,
}: {
  sale?: Sale
  onMarkPaid: () => Promise<void> | void
  onCancel: () => Promise<void> | void
}) {
  if (!sale)
    return (
      <main>
        <h1>Open cart</h1>
        <p>No open sale is waiting for checkout.</p>
      </main>
    )
  return (
    <main>
      <header>
        <p>Checkout operations</p>
        <h1>Open cart</h1>
      </header>
      <p>Sale {sale.id}</p>
      <SaleCartActions
        sale={sale}
        onMarkPaid={onMarkPaid}
        onCancel={onCancel}
      />
    </main>
  )
}
