// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { SaleCreationForm } from "@/features/sale-creation/ui/sale-creation-form"

describe("sales workflows", () => {
  it("submits sale creation with a stable idempotency key", async () => {
    const user = userEvent.setup()
    const submissions: unknown[] = []

    render(
      <SaleCreationForm
        onCreate={(payload, idempotencyKey) => {
          submissions.push({ payload, idempotencyKey })
        }}
      />,
    )

    await user.type(screen.getByLabelText("Customer name"), "Walk-in")
    await user.click(screen.getByRole("button", { name: "Create sale" }))
    await user.click(screen.getByRole("button", { name: "Create sale" }))

    expect(submissions).toHaveLength(2)
    expect(submissions[0]).toEqual({
      payload: { customerName: "Walk-in", items: [] },
      idempotencyKey: submissions[1].idempotencyKey,
    })
  })
})
