import type { FormEvent } from "react"
import { useRef } from "react"
import type { SaleCreatePayload } from "@/entities/sale"

export function SaleCreationForm({
  onCreate,
}: {
  onCreate: (
    payload: SaleCreatePayload,
    idempotencyKey: string,
  ) => Promise<void> | void
}) {
  const idempotencyKey = useRef(crypto.randomUUID()).current

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await onCreate(
      {
        customerName: String(data.get("customerName") ?? "") || undefined,
        items: [],
      },
      idempotencyKey,
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="sale-customer-name">Customer name</label>
      <input id="sale-customer-name" name="customerName" />
      <button type="submit">Create sale</button>
    </form>
  )
}
