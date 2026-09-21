import { CatalogMedicineEditor } from "@/features/catalog-medicine-editing"
import type { Medicine, MedicineWritePayload } from "@/entities/medicine"

export type CatalogWidgetProps = {
  medicines: Medicine[]
  onUpdate: (id: string, payload: MedicineWritePayload) => Promise<void> | void
}

export function CatalogWidget({ medicines, onUpdate }: CatalogWidgetProps) {
  if (medicines.length === 0) {
    return <p>No medicines found.</p>
  }

  return (
    <section aria-label="Medicine catalog">
      {medicines.map((medicine) => (
        <CatalogMedicineEditor
          key={medicine.id}
          medicine={medicine}
          onSave={(payload) => onUpdate(medicine.id, payload)}
        />
      ))}
    </section>
  )
}
