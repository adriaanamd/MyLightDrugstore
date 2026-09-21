import type { InventoryReceiptPayload } from "@/entities/inventory"
import { InventoryReceiptForm } from "@/features/inventory-receiving"

export function InventoryReceiptsPage({
  medicineId,
  onReceive,
}: {
  medicineId: string
  onReceive: (payload: InventoryReceiptPayload) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <h1>Receive stock</h1>
      </header>
      <InventoryReceiptForm medicineId={medicineId} onSubmit={onReceive} />
    </main>
  )
}
