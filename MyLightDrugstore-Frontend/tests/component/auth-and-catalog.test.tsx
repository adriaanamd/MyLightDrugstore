import { describe, expect, it } from "vitest"

import { validatePasswordChange } from "../../src/features/password-change"
import { validateMedicineForm } from "../../src/features/catalog-management"

describe("auth and catalog feature behavior", () => {
  it("enforces the password contract used by the security page", () => {
    expect(
      validatePasswordChange({
        currentPassword: "old-password",
        newPassword: "short",
        confirmPassword: "short",
      }).valid,
    ).toBe(false)
    expect(
      validatePasswordChange({
        currentPassword: "old-password",
        newPassword: "a-secure-password",
        confirmPassword: "a-secure-password",
      }).valid,
    ).toBe(true)
  })

  it("rejects incomplete catalog form values before mutation", () => {
    expect(
      validateMedicineForm({
        genericName: "",
        dosageForm: "tablet",
        unitPrice: "0",
      }).valid,
    ).toBe(false)
  })
})
