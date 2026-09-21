import type { Sale } from "@/entities/sale"

export function SaleCartActions({
  sale,
  onMarkPaid,
  onCancel,
}: {
  sale: Sale
  onMarkPaid: () => Promise<void> | void
  onCancel: () => Promise<void> | void
}) {
  return (
    <div aria-label={`Actions for sale ${sale.id}`}>
      <button
        type="button"
        onClick={onMarkPaid}
        disabled={sale.status !== "open"}
      >
        Mark paid
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={sale.status !== "open"}
      >
        Cancel sale
      </button>
    </div>
  )
}
