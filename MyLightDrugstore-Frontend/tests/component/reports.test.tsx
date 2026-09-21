// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import {
  mapInventoryReportResponse,
  mapSalesReportResponse,
} from "@/entities/report"
import { InventoryReportPage } from "@/pages/reports/inventory-report-page"
import { SalesReportPage } from "@/pages/reports/sales-report-page"

interface ReportFilterCapture {
  from?: string
  to?: string
}

describe("reports", () => {
  it("maps Laravel report envelopes into typed report data", () => {
    expect(
      mapInventoryReportResponse({
        data: [{ medicineId: "med-1", stockOnHand: 12 }],
        meta: { total: 1 },
      }),
    ).toEqual({
      rows: [{ medicineId: "med-1", stockOnHand: 12 }],
      total: 1,
    })

    expect(
      mapSalesReportResponse({
        data: {
          saleCount: 4,
          grossSales: "120.00",
          paidSaleCount: 3,
          paidGrossSales: "90.00",
          cancelledSaleCount: 1,
        },
      }),
    ).toMatchObject({ saleCount: 4, grossSales: "120.00" })
  })

  it("submits date filters from both report pages", async () => {
    const user = userEvent.setup()
    const filters: ReportFilterCapture[] = []

    render(
      <>
        <InventoryReportPage
          rows={[]}
          onFilter={(value) => filters.push(value)}
        />
        <SalesReportPage
          report={{
            saleCount: 0,
            grossSales: "0.00",
            paidSaleCount: 0,
            paidGrossSales: "0.00",
            cancelledSaleCount: 0,
          }}
          onFilter={(value) => filters.push(value)}
        />
      </>,
    )

    await user.type(screen.getByLabelText("Inventory from"), "2026-09-01")
    await user.type(screen.getByLabelText("Sales to"), "2026-09-22")
    await user.click(
      screen.getByRole("button", { name: "Apply inventory filters" }),
    )
    await user.click(
      screen.getByRole("button", { name: "Apply sales filters" }),
    )

    expect(filters).toEqual([{ from: "2026-09-01" }, { to: "2026-09-22" }])
  })
})
