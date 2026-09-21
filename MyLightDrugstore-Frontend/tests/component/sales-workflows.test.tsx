// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { SaleCreationForm } from "@/features/sale-creation/ui/sale-creation-form"
import { SalePrintPage } from "@/pages/sales/sale-print-page"
import { SalesPage } from "@/pages/sales/sales-page"
import type { Sale } from "@/entities/sale"

describe("sales workflows", () => {
  it("submits sale creation with a stable idempotency key", async () => {
    const user = userEvent.setup()
    const submissions: Array<{
      payload: unknown
      idempotencyKey: string
    }> = []

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

  it("exposes sale lifecycle actions and browser printing", async () => {
    const user = userEvent.setup()
    const sale: Sale = { id: "sale-1", status: "open", total: 25 }
    const events: string[] = []
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined)

    render(
      <>
        <SalesPage
          sales={[sale]}
          onMarkPaid={() => {
            events.push("paid")
          }}
          onCancel={() => {
            events.push("cancelled")
          }}
        />
        <SalePrintPage sale={sale} />
      </>,
    )

    await user.click(screen.getByRole("button", { name: "Mark paid" }))
    await user.click(screen.getByRole("button", { name: "Cancel sale" }))
    await user.click(screen.getByRole("button", { name: "Print receipt" }))

    expect(events).toEqual(["paid", "cancelled"])
    expect(print).toHaveBeenCalledOnce()
    print.mockRestore()
  })
})
