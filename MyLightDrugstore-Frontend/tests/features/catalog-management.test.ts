import { describe, expect, it, vi } from "vitest"

import {
  createCatalogActions,
  type CatalogApi,
} from "../../src/features/catalog-management/api/mutations"
import {
  normalizeMedicineForm,
  validateMedicineForm,
  type MedicineFormValues,
} from "../../src/features/catalog-management/model/forms"

const form: MedicineFormValues = {
  genericName: "Amoxicillin",
  brandName: "Amoxil",
  description: "Capsule",
  dosageForm: "capsule",
  strength: "500 mg",
  unitPrice: "12.5",
  storageLocation: "Shelf A-1",
}

describe("catalog management feature", () => {
  it("validates and normalizes the current medicine form", () => {
    expect(validateMedicineForm({ ...form, genericName: "" })).toEqual({
      valid: false,
      errors: { genericName: "Generic name is required." },
    })
    expect(validateMedicineForm({ ...form, unitPrice: "not-a-price" })).toEqual(
      {
        valid: false,
        errors: { unitPrice: "Valid unit price is required." },
      },
    )
    expect(validateMedicineForm(form)).toEqual({ valid: true, errors: {} })
    expect(normalizeMedicineForm(form)).toEqual({
      genericName: "Amoxicillin",
      brandName: "Amoxil",
      description: "Capsule",
      dosageForm: "capsule",
      strength: "500 mg",
      unitPrice: "12.50",
      storageLocation: "Shelf A-1",
    })
  })

  it("keeps mutation actions on the medicine entity api", async () => {
    const api: CatalogApi = {
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      show: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 1 }),
      archive: vi.fn().mockResolvedValue({ id: 1 }),
    }
    const actions = createCatalogActions(api)

    await actions.create(form)
    await actions.update(1, form)
    await actions.archive(1)

    expect(api.create).toHaveBeenCalledWith(normalizeMedicineForm(form))
    expect(api.update).toHaveBeenCalledWith(1, normalizeMedicineForm(form))
    expect(api.archive).toHaveBeenCalledWith(1)
  })
})
