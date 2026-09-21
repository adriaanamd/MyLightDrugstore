// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { InventoryAdjustmentForm } from "@/features/inventory-adjustments/ui/inventory-adjustment-form"
import { InventoryReceiptForm } from "@/features/inventory-receiving/ui/inventory-receipt-form"

describe("inventory workflows", () => {
  it("submits a receipt payload", async () => {
    const user = userEvent.setup()
    let submitted: unknown

    render(
      <InventoryReceiptForm
        medicineId="med-1"
        onSubmit={(payload) => {
          submitted = payload
        }}
      />,
    )

    await user.type(screen.getByLabelText("Quantity"), "10")
    await user.type(screen.getByLabelText("Unit cost"), "12.50")
    await user.click(screen.getByRole("button", { name: "Receive stock" }))

    expect(submitted).toEqual({ medicineId: "med-1", quantity: 10, unitCost: 12.5 })
  })

  it("submits a signed adjustment payload", async () => {
    const user = userEvent.setup()
    let submitted: unknown

    render(
      <InventoryAdjustmentForm
        medicineId="med-1"
        onSubmit={(payload) => {
          submitted = payload
        }}
      />,
    )

    await user.type(screen.getByLabelText("Quantity adjustment"), "-2")
    await user.type(screen.getByLabelText("Reason"), "damaged")
    await user.click(screen.getByRole("button", { name: "Adjust stock" }))

    expect(submitted).toEqual({ medicineId: "med-1", quantity: -2, reason: "damaged" })
  })
})
