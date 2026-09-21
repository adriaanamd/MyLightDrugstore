import type {
  InventoryAdjustmentPayload,
  InventoryItem,
  InventoryReceiptPayload,
} from "@/entities/inventory"
import { InventoryAdjustmentForm } from "@/features/inventory-adjustments"
import { InventoryReceiptForm } from "@/features/inventory-receiving"

export function InventoryWidget({
  medicineId,
  items,
  onReceive,
  onAdjust,
}: {
  medicineId: string
  items: InventoryItem[]
  onReceive: (payload: InventoryReceiptPayload) => Promise<void> | void
  onAdjust: (payload: InventoryAdjustmentPayload) => Promise<void> | void
}) {
  return (
    <section aria-label="Inventory workflows">
      <p>Lots on hand: {items.length}</p>
      <InventoryReceiptForm medicineId={medicineId} onSubmit={onReceive} />
      <InventoryAdjustmentForm medicineId={medicineId} onSubmit={onAdjust} />
    </section>
  )
}
