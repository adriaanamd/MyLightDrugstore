import type { InventoryAdjustmentPayload } from "@/entities/inventory"
import { InventoryAdjustmentForm } from "@/features/inventory-adjustments"

export function InventoryAdjustmentsPage({
  medicineId,
  onAdjust,
}: {
  medicineId: string
  onAdjust: (payload: InventoryAdjustmentPayload) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <h1>Adjust stock</h1>
      </header>
      <InventoryAdjustmentForm medicineId={medicineId} onSubmit={onAdjust} />
    </main>
  )
}
