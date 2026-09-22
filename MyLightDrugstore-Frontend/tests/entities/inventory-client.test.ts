import { describe, expect, it } from "vitest"

import { createInventoryApi } from "../../src/entities/inventory/api/inventory-client"
import type {
  InventoryLot,
  InventoryMovement,
  InventorySummary,
} from "../../src/entities/inventory/model/types"
import type { TransportResponse } from "../../src/shared/api"

type RequestCall = {
  path: string

  init?: RequestInit & { body?: unknown }
}

function createTestClient(responses: unknown[]) {
  const calls: RequestCall[] = []

  const request = async <T,>(
    path: string,
    init?: RequestCall["init"],
  ): Promise<TransportResponse<T>> => {
    calls.push({ path, init })

    return {
      data: responses.shift() as T,
      status: 200,
      headers: new Headers(),
    }
  }

  return { calls, client: { request } }
}

const summary: InventorySummary = {
  medicineId: 42,
  genericName: "Amoxicillin",
  brandName: "Amoxil",
  dosageForm: "capsule",
  strength: "500 mg",
  unitPrice: "12.50",
  stockOnHand: 18,
  lowStock: true,
  earliestExpiry: "2027-03-31",
}

const lot: InventoryLot = {
  lotId: 301,
  medicineId: 42,
  genericName: "Amoxicillin",
  brandName: "Amoxil",
  receivedAt: "2026-09-18T02:00:00Z",
  expiresAt: "2027-03-31",
  quantityReceived: 24,
  quantityRemaining: 18,
  available: true,
}

const movement: InventoryMovement = {
  movementId: 501,
  medicineId: 42,
  genericName: "Amoxicillin",
  lotId: 301,
  actorUserId: 7,
  actorFullName: "Ada Staff",
  movementType: "receipt",
  quantityDelta: 24,
  reason: null,
  sourceType: "receipt",
  sourceId: 77,
  occurredAt: "2026-09-18T02:00:00Z",
}

describe("inventory api", () => {
  it("maps summary, lot, and movement filters and pages", async () => {
    const { calls, client } = createTestClient([
      { data: [summary], meta: { page: 2, perPage: 25, total: 1 } },
      { data: [lot], meta: { page: 1, perPage: 25, total: 1 } },
      { data: [movement], meta: { page: 3, perPage: 10, total: 1 } },
    ])
    const api = createInventoryApi(client)

    await expect(
      api.summary({ lowStock: true, expiresBefore: "2027-04-01", page: 2 }),
    ).resolves.toEqual({
      data: [summary],
      meta: { page: 2, perPage: 25, total: 1 },
    })
    await expect(
      api.lots({
        medicineId: 42,
        expiresBefore: "2027-04-01",
        available: true,
      }),
    ).resolves.toEqual({
      data: [lot],
      meta: { page: 1, perPage: 25, total: 1 },
    })
    await expect(
      api.movements({
        medicineId: 42,
        lotId: 301,
        movementType: "receipt",
        from: "2026-09-01",
        to: "2026-09-30",
        page: 3,
        perPage: 10,
      }),
    ).resolves.toEqual({
      data: [movement],
      meta: { page: 3, perPage: 10, total: 1 },
    })

    expect(calls.map((call) => call.path)).toEqual([
      "/inventory?lowStock=true&expiresBefore=2027-04-01&page=2",
      "/inventory/lots?medicineId=42&expiresBefore=2027-04-01&available=true",
      "/inventory/movements?medicineId=42&lotId=301&movementType=receipt&from=2026-09-01&to=2026-09-30&page=3&perPage=10",
    ])
  })

  it("sends exact receipt and adjustment payloads", async () => {
    const { calls, client } = createTestClient([
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
          adjustmentId: 88,
          reason: "stock_count",
          itemCount: 1,
          totalQuantityDelta: -2,
        },
      },
    ])
    const api = createInventoryApi(client)
    const receipt = {
      receivedAt: "2026-09-18T02:00:00Z",
      items: [{ medicineId: 42, quantity: 24, expiresAt: "2027-03-31" }],
    }
    const adjustment = {
      reason: "stock_count" as const,
      items: [{ lotId: 301, quantityDelta: -2 }],
    }

    await expect(api.receive(receipt)).resolves.toEqual({
      receiptId: 77,
      receivedAt: "2026-09-18T02:00:00Z",
      itemCount: 1,
      totalQuantity: 24,
    })
    await expect(api.adjust(adjustment)).resolves.toEqual({
      adjustmentId: 88,
      reason: "stock_count",
      itemCount: 1,
      totalQuantityDelta: -2,
    })

    expect(calls).toMatchObject([
      { path: "/inventory/receipts", init: { method: "POST", body: receipt } },
      {
        path: "/inventory/adjustments",
        init: { method: "POST", body: adjustment },
      },
    ])
  })
})
