import type { Sale } from "@/entities/sale"

export function SalePrintPage({ sale }: { sale: Sale }) {
  return (
    <main>
      <h1>Receipt {sale.id}</h1>
      <p>Total: {sale.total ?? 0}</p>
      <button type="button" onClick={() => window.print()}>
        Print receipt
      </button>
    </main>
  )
}
