import { describe, expect, it, vi } from "vitest"

import {
  createInventoryMutationActions,
  type InventoryMutationApi,
} from "../../src/features/inventory-mutations/api/mutations"
import {
  validateAdjustmentForm,
  type AdjustmentFormValues,
} from "../../src/features/inventory-adjustments/model/forms"
import {
  validateReceiptForm,
  type ReceiptFormValues,
} from "../../src/features/inventory-receipts/model/forms"

const receipt: ReceiptFormValues = {
  receivedAt: "2026-09-18T02:00:00Z",
  items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
}

const adjustment: AdjustmentFormValues = {
  reason: "stock_count",
  items: [{ lotId: 301, quantityDelta: -2 }],
}

describe("inventory mutation features", () => {
  it("validates receipt and signed adjustment forms", () => {
    expect(validateReceiptForm({ ...receipt, items: [] }).valid).toBe(false)
    expect(
      validateReceiptForm({
        ...receipt,
        items: [{ ...receipt.items[0], quantity: 0 }],
      }).valid,
    ).toBe(false)
    expect(validateReceiptForm(receipt).valid).toBe(true)

    expect(
      validateAdjustmentForm({
        ...adjustment,
        items: [{ ...adjustment.items[0], quantityDelta: 0 }],
      }).valid,
    ).toBe(false)
    expect(validateAdjustmentForm(adjustment).valid).toBe(true)
  })

  it("sends exact payloads and calls refresh callbacks", async () => {
    const api: InventoryMutationApi = {
      summary: vi.fn(),
      list: vi.fn(),
      lots: vi.fn(),
      movements: vi.fn(),
      receive: vi.fn().mockResolvedValue({ receiptId: 77 }),
      adjust: vi.fn().mockResolvedValue({ adjustmentId: 88 }),
    }
    const refresh = vi.fn()
    const actions = createInventoryMutationActions(api)

    await expect(actions.receive(receipt, refresh)).resolves.toEqual({
      receiptId: 77,
    })
    await expect(actions.adjust(adjustment, refresh)).resolves.toEqual({
      adjustmentId: 88,
    })

    expect(api.receive).toHaveBeenCalledWith(receipt)
    expect(api.adjust).toHaveBeenCalledWith(adjustment)
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
