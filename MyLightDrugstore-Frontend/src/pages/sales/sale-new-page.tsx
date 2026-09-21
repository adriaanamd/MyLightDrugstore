import type { SaleCreatePayload } from "@/entities/sale"
import { SaleCreationForm } from "@/features/sale-creation"

export function SaleNewPage({
  onCreate,
}: {
  onCreate: (
    payload: SaleCreatePayload,
    idempotencyKey: string,
  ) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <p>Checkout operations</p>
        <h1>New sale</h1>
      </header>
      <SaleCreationForm onCreate={onCreate} />
    </main>
  )
}
