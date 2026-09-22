import { describe, expect, it } from "vitest"

import { createBackupApi } from "../../src/entities/backup"
import { createInventoryApi } from "../../src/entities/inventory"
import { createMedicineApi } from "../../src/entities/medicine"
import { createSaleApi } from "../../src/entities/sale"
import type {
  TransportRequestInit,
  TransportResponse,
} from "../../src/shared/api"

type Call = { path: string init?: TransportRequestInit }

function createRecordingTransport(responses: unknown[]) {
  const calls: Call[] = []
  const request = async <T,>(
    path: string,
    init?: Call["init"],
  ): Promise<TransportResponse<T>> => {
    calls.push({ path, init })
    return { data: responses.shift() as T, status: 200, headers: new Headers() }
  }
  return { calls, client: { request } }
}

describe("entity-to-backend integration contracts", () => {
  it("keeps medicine, inventory, and sale payloads on typed backend routes", async () => {
    const { calls, client } = createRecordingTransport([
      {
        data: [
          {
            id: 42,
            genericName: "Amoxicillin",
            brandName: null,
            description: null,
            dosageForm: "capsule",
            strength: null,
            unitPrice: "12.50",
            storageLocation: null,
            active: true,
            stockOnHand: 18,
            createdAt: "2026-09-18T02:00:00Z",
            updatedAt: null,
          },
        ],
        meta: { page: 1, perPage: 25, total: 1 },
      },
      {
        data: {
          receiptId: 77,
          receivedAt: "2026-09-18T02:00:00Z",
          itemCount: 1,
          totalQuantity: 24,
        },
      },
      {
        data: {
          id: 9001,
          state: "open",
          paymentStatus: "unpaid",
          total: "25.00",
          createdBy: 7,
          createdAt: "2026-09-18T02:00:00Z",
        },
      },
    ])
    const medicines = createMedicineApi(client)
    const inventory = createInventoryApi(client)
    const sales = createSaleApi(client)

    await medicines.list({ q: "amox", active: true, perPage: 25 })
    await inventory.receive({
      receivedAt: "2026-09-18T02:00:00Z",
      items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
    })
    await sales.create({ items: [{ medicineId: 42, quantity: 2 }] }, "sale-key")

    expect(calls).toEqual([
      {
        path: "/medicines?q=amox&active=true&perPage=25",
        init: { method: "GET" },
      },
      {
        path: "/inventory/receipts",
        init: {
          method: "POST",
          body: {
            receivedAt: "2026-09-18T02:00:00Z",
            items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
          },
        },
      },
      {
        path: "/sales",
        init: {
          method: "POST",
          body: { items: [{ medicineId: 42, quantity: 2 }] },
          headers: { "Idempotency-Key": "sale-key" },
        },
      },
    ])
  })

  it("preserves binary backup downloads without JSON conversion", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    const { calls, client } = createRecordingTransport([bytes])
    const backups = createBackupApi(client)

    await expect(backups.download(77)).resolves.toEqual(bytes)
    expect(calls).toEqual([
      { path: "/backups/77/download", init: { method: "GET" } },
    ])
  })
})
