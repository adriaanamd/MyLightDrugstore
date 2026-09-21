import type { InventoryItem } from "@/entities/inventory"

export function InventoryMovementsPage({ items }: { items: InventoryItem[] }) {
  return (
    <main>
      <header>
        <h1>Inventory movements</h1>
      </header>
      <table>
        <caption>Stock movements</caption>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.medicineId}-${index}`}>
              <td>{item.medicineId}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
