import type {
  InventoryAdjustmentPayload,
  InventoryItem,
  InventoryReceiptPayload,
} from "@/entities/inventory"
import { InventoryWidget } from "@/widgets/inventory"

export function InventoryPage({
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
    <main>
      <header>
        <p>Stock control</p>
        <h1>Inventory</h1>
        <p>Receive goods and keep stock corrections auditable.</p>
      </header>
      <InventoryWidget
        medicineId={medicineId}
        items={items}
        onReceive={onReceive}
        onAdjust={onAdjust}
      />
    </main>
  )
}
