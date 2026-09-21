import type { Medicine, MedicineWritePayload } from "@/entities/medicine"

export type CatalogMedicineEditorProps = {
  medicine: Pick<Medicine, "id" | "name">
  onSave: (payload: MedicineWritePayload) => Promise<void> | void
}
