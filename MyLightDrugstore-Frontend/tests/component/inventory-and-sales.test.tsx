import { describe, expect, it, vi } from "vitest"

import {
  createInventoryMutationActions,
  type InventoryMutationApi,
} from "../../src/features/inventory-mutations"
import {
  createSalesEntryActions,
  type SalesApi,
} from "../../src/features/sales-entry"

describe("inventory and sales page behavior", () => {
  it("sends receipt mutations and refreshes the inventory page", async () => {
    const api: InventoryMutationApi = {
      summary: vi.fn(),
      list: vi.fn(),
      lots: vi.fn(),
      movements: vi.fn(),
      receive: vi.fn().mockResolvedValue({ receiptId: 77 }),
      adjust: vi.fn(),
    }
    const refresh = vi.fn()
    const actions = createInventoryMutationActions(api)

    await actions.receive(
      {
        receivedAt: "2026-09-18T02:00:00Z",
        items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
      },
      refresh,
    )

    expect(api.receive).toHaveBeenCalledWith({
      receivedAt: "2026-09-18T02:00:00Z",
      items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("reuses the sale idempotency key while the page retries", async () => {
    const api: SalesApi = {
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 9001 }),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      show: vi.fn(),
      markPaid: vi.fn(),
      cancel: vi.fn(),
    }
    const actions = createSalesEntryActions(api, () => "sale-key")
    const payload = { items: [{ medicineId: 42, quantity: 2 }] }

    await actions.create(payload)
    await actions.create(payload)

    expect(api.create).toHaveBeenNthCalledWith(1, payload, "sale-key")
    expect(api.create).toHaveBeenNthCalledWith(2, payload, "sale-key")
  })
})
