import { describe, expect, it } from "vitest"

import { createSaleApi } from "../../src/entities/sale/api/sale-client"
import { createIdempotencyKey } from "../../src/shared/lib/idempotency-key"
import type { Sale } from "../../src/entities/sale/model/types"
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

const wireSale = {
  id: 9001,
  state: "open",
  paymentStatus: "unpaid",
  total: "25.00",
  createdBy: 7,
  createdAt: "2026-09-18T02:00:00Z",
  items: [
    {
      id: 1,
      medicineId: 42,
      quantity: 2,
      unitPrice: "12.50",
      lineTotal: "25.00",
      state: "active",
    },
  ],
}

const sale: Sale = {
  id: 9001,
  state: "open",
  paymentStatus: "unpaid",
  grandTotal: "25.00",
  createdBy: 7,
  createdAt: "2026-09-18T02:00:00Z",
  items: [
    {
      id: 1,
      medicineId: 42,
      quantity: 2,
      unitPrice: "12.50",
      lineTotal: "25.00",
      state: "active",
    },
  ],
}

describe("sale api", () => {
  it("maps list filters and sale responses", async () => {
    const { calls, client } = createTestClient([
      { data: [wireSale], meta: { page: 2, perPage: 10, total: 1 } },
    ])
    const api = createSaleApi(client)

    await expect(
      api.list({
        paymentStatus: "unpaid",
        state: "open",
        from: "2026-09-01",
        to: "2026-09-30",
        createdBy: 7,
        page: 2,
        perPage: 10,
      }),
    ).resolves.toEqual({
      data: [sale],
      meta: { page: 2, perPage: 10, total: 1 },
    })

    expect(calls[0].path).toBe(
      "/sales?paymentStatus=unpaid&state=open&from=2026-09-01&to=2026-09-30&createdBy=7&page=2&perPage=10",
    )
  })

  it("sends idempotency and action contracts", async () => {
    const { calls, client } = createTestClient([
      { data: wireSale },
      { data: wireSale },
      { data: wireSale },
      { data: wireSale },
      { data: wireSale },
      { data: wireSale },
    ])
    const api = createSaleApi(client)
    const item = { medicineId: 42, quantity: 2 }

    await expect(api.create({ items: [item] }, "create-key")).resolves.toEqual(
      sale,
    )
    await expect(api.addItem(9001, item, "add-key")).resolves.toEqual(sale)
    await expect(api.removeItem(9001, 1)).resolves.toEqual(sale)
    await expect(api.show(9001)).resolves.toEqual(sale)
    await expect(api.markPaid(9001)).resolves.toEqual(sale)
    await expect(api.cancel(9001, "entered_in_error")).resolves.toEqual(sale)

    expect(calls).toMatchObject([
      {
        path: "/sales",
        init: {
          method: "POST",
          body: { items: [item] },
          headers: { "Idempotency-Key": "create-key" },
        },
      },
      {
        path: "/sales/9001/items",
        init: {
          method: "POST",
          body: item,
          headers: { "Idempotency-Key": "add-key" },
        },
      },
      { path: "/sales/9001/items/1", init: { method: "DELETE" } },
      { path: "/sales/9001", init: { method: "GET" } },
      { path: "/sales/9001/mark-paid", init: { method: "POST" } },
      {
        path: "/sales/9001/cancel",
        init: { method: "POST", body: { reason: "entered_in_error" } },
      },
    ])
  })

  it("creates a UUID-shaped idempotency key", () => {
    expect(createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})
