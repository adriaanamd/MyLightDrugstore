import type {
  MedicineCreatePayload,
  MedicineUpdatePayload,
} from "@/entities/medicine"

export type MedicineFormValues = {
  genericName: string

  brandName: string

  description: string

  dosageForm: string

  strength: string

  unitPrice: string

  storageLocation: string
}

export type MedicineFormField = keyof MedicineFormValues

export type MedicineFormValidation = {
  valid: boolean

  errors: Partial<Record<MedicineFormField, string>>
}

export function validateMedicineForm(
  values: MedicineFormValues,
): MedicineFormValidation {
  const errors: Partial<Record<MedicineFormField, string>> = {}

  if (!values.genericName.trim()) {
    errors.genericName = "Generic name is required."
  }

  if (!values.dosageForm.trim()) {
    errors.dosageForm = "Dosage form is required."
  }

  const unitPrice = Number(values.unitPrice)

  if (!values.unitPrice || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    errors.unitPrice = "Valid unit price is required."
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function normalizeMedicineForm(
  values: MedicineFormValues,
): MedicineCreatePayload & MedicineUpdatePayload {
  return {
    genericName: values.genericName.trim(),
    brandName: nullableText(values.brandName),
    description: nullableText(values.description),
    dosageForm: values.dosageForm.trim(),
    strength: nullableText(values.strength),
    unitPrice: Number(values.unitPrice).toFixed(2),
    storageLocation: nullableText(values.storageLocation),
  }
}

function nullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}
