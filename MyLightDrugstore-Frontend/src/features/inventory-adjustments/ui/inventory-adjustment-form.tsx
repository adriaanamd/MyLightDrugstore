import type { FormEvent } from "react"
import type { InventoryAdjustmentPayload } from "@/entities/inventory"

export function InventoryAdjustmentForm({
  medicineId,
  onSubmit,
}: {
  medicineId: string
  onSubmit: (payload: InventoryAdjustmentPayload) => Promise<void> | void
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await onSubmit({
      medicineId,
      quantity: Number(data.get("quantity")),
      reason: String(data.get("reason") ?? ""),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Adjust stock</h2>
      <label htmlFor="adjustment-quantity">Quantity adjustment</label>
      <input id="adjustment-quantity" name="quantity" type="number" required />
      <label htmlFor="adjustment-reason">Reason</label>
      <input id="adjustment-reason" name="reason" required />
      <button type="submit">Adjust stock</button>
    </form>
  )
}
