import type { Medicine, MedicineWritePayload } from "@/entities/medicine"
import { CatalogWidget } from "@/widgets/catalog"

export type CatalogPageProps = {
  medicines: Medicine[]
  onUpdate: (id: string, payload: MedicineWritePayload) => Promise<void> | void
}

export function CatalogPage({ medicines, onUpdate }: CatalogPageProps) {
  return (
    <main>
      <header>
        <p>Inventory foundation</p>
        <h1>Catalog</h1>
        <p>Maintain medicine names, pricing, and availability.</p>
      </header>
      <CatalogWidget medicines={medicines} onUpdate={onUpdate} />
    </main>
  )
}
