import type { FormEvent } from "react"
import type { InventoryReceiptPayload } from "@/entities/inventory"

export function InventoryReceiptForm({
  medicineId,
  onSubmit,
}: {
  medicineId: string
  onSubmit: (payload: InventoryReceiptPayload) => Promise<void> | void
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await onSubmit({
      medicineId,
      quantity: Number(data.get("quantity")),
      unitCost: Number(data.get("unitCost")),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Receive stock</h2>
      <label htmlFor="receipt-quantity">Quantity</label>
      <input
        id="receipt-quantity"
        name="quantity"
        type="number"
        min="1"
        required
      />
      <label htmlFor="receipt-unit-cost">Unit cost</label>
      <input
        id="receipt-unit-cost"
        name="unitCost"
        type="number"
        min="0"
        step="0.01"
        required
      />
      <button type="submit">Receive stock</button>
    </form>
  )
}
