import type { Sale } from "@/entities/sale"
import { SalesWidget } from "@/widgets/sales"

export function SalesPage({
  sales,
  onMarkPaid,
  onCancel,
}: {
  sales: Sale[]
  onMarkPaid: (id: string) => Promise<void> | void
  onCancel: (id: string) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <p>Checkout operations</p>
        <h1>Sales</h1>
        <p>Review open orders and complete their lifecycle.</p>
      </header>
      <SalesWidget sales={sales} onMarkPaid={onMarkPaid} onCancel={onCancel} />
    </main>
  )
}
