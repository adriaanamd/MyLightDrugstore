import { useState } from "react"
import type { FormEvent } from "react"
import type { CatalogMedicineEditorProps } from "../model/types"

export function CatalogMedicineEditor({
  medicine,
  onSave,
}: CatalogMedicineEditorProps) {
  const [name, setName] = useState(medicine.name)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    try {
      await onSave({ name })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`medicine-name-${medicine.id}`}>Medicine name</label>
      <input
        id={`medicine-name-${medicine.id}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : "Save medicine"}
      </button>
    </form>
  )
}
