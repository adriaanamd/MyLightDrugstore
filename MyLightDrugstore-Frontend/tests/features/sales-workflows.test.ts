import { describe, expect, it, vi } from "vitest"

import {
  createSalesEntryActions,
  type SalesApi,
} from "../../src/features/sales-entry/api/mutations"
import { createSalesCartActions } from "../../src/features/sales-cart/api/mutations"

const item = { medicineId: 42, quantity: 2 }

describe("sales workflow features", () => {
  it("reuses an entry key for retries and rotates it for a new action", async () => {
    const api: SalesApi = {
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 9001 }),
      addItem: vi.fn().mockResolvedValue({ id: 9001 }),
      removeItem: vi.fn(),
      show: vi.fn(),
      markPaid: vi.fn(),
      cancel: vi.fn(),
    }
    const keyFactory = vi
      .fn<() => string>()
      .mockReturnValueOnce("create-key-1")
      .mockReturnValueOnce("create-key-2")
      .mockReturnValueOnce("add-key-1")
    const actions = createSalesEntryActions(api, keyFactory)

    await actions.create({ items: [item] })
    await actions.create({ items: [item] })
    actions.resetCreate()
    await actions.create({ items: [item] })
    await actions.addItem(9001, item)
    await actions.addItem(9001, item)

    expect(api.create).toHaveBeenNthCalledWith(
      1,
      { items: [item] },
      "create-key-1",
    )
    expect(api.create).toHaveBeenNthCalledWith(
      2,
      { items: [item] },
      "create-key-1",
    )
    expect(api.create).toHaveBeenNthCalledWith(
      3,
      { items: [item] },
      "create-key-2",
    )
    expect(api.addItem).toHaveBeenNthCalledWith(1, 9001, item, "add-key-1")
    expect(api.addItem).toHaveBeenNthCalledWith(2, 9001, item, "add-key-1")
    expect(keyFactory).toHaveBeenCalledTimes(3)
  })

  it("keeps cart actions on the sale entity api", async () => {
    const api: SalesApi = {
      list: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn().mockResolvedValue({ id: 9001 }),
      show: vi.fn(),
      markPaid: vi.fn().mockResolvedValue({ id: 9001 }),
      cancel: vi.fn().mockResolvedValue({ id: 9001 }),
    }
    const actions = createSalesCartActions(api)

    await actions.removeItem(9001, 1)
    await actions.markPaid(9001)
    await actions.cancel(9001, "entered_in_error")

    expect(api.removeItem).toHaveBeenCalledWith(9001, 1)
    expect(api.markPaid).toHaveBeenCalledWith(9001)
    expect(api.cancel).toHaveBeenCalledWith(9001, "entered_in_error")
  })
})
