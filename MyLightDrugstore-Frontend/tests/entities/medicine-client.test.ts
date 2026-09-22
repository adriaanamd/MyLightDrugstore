import { describe, expect, it } from "vitest"

import { createMedicineApi } from "../../src/entities/medicine/api/medicine-client"
import type { Medicine } from "../../src/entities/medicine/model/types"
import type { TransportResponse } from "../../src/shared/api"

type RequestCall = {
  path: string

  init?: Parameters<NonNullable<Parameters<typeof createMedicineApi>[0]["request"]>>[1]
}

function createTestClient(responses: unknown[]) {
  const calls: RequestCall[] = []

  const request = async <T,>(
    path: string,
    init?: RequestCall["init"],
  ): Promise<TransportResponse<T>> => {
    calls.push({ path, init })

    const data = responses.shift()

    return {
      data: data as T,
      status: 200,
      headers: new Headers(),
    }
  }

  return { calls, client: { request } }
}

const medicine: Medicine = {
  id: 42,
  genericName: "Amoxicillin",
  brandName: "Amoxil",
  description: null,
  dosageForm: "capsule",
  strength: "500 mg",
  unitPrice: "12.50",
  storageLocation: null,
  active: true,
  stockOnHand: 18,
  createdAt: "2026-09-18T02:00:00Z",
  updatedAt: null,
}

describe("medicine api", () => {
  it("maps list filters and paginated response data", async () => {
    const { calls, client } = createTestClient([
      {
        data: [medicine],
        meta: { page: 2, perPage: 25, total: 1 },
      },
    ])
    const api = createMedicineApi(client)

    const result = await api.list({
      q: "amox",
      active: true,
      lowStock: false,
      expiresBefore: "2026-12-01",
      page: 2,
      perPage: 25,
    })

    expect(calls[0]).toMatchObject({
      path: "/medicines?q=amox&active=true&lowStock=false&expiresBefore=2026-12-01&page=2&perPage=25",
      init: { method: "GET" },
    })
    expect(result).toEqual({
      data: [medicine],
      meta: { page: 2, perPage: 25, total: 1 },
    })
  })

  it("maps create, show, update, and archive operations", async () => {
    const { calls, client } = createTestClient([
      { data: medicine },
      { data: medicine },
      { data: medicine },
      { data: medicine },
    ])
    const api = createMedicineApi(client)
    const payload = {
      genericName: "Amoxicillin",
      dosageForm: "capsule",
      unitPrice: "12.50",
    }

    await expect(api.create(payload)).resolves.toEqual(medicine)
    await expect(api.show(42)).resolves.toEqual(medicine)
    await expect(api.update(42, { unitPrice: "13.00" })).resolves.toEqual(
      medicine,
    )
    await expect(api.archive(42)).resolves.toEqual(medicine)

    expect(calls).toMatchObject([
      { path: "/medicines", init: { method: "POST", body: payload } },
      { path: "/medicines/42", init: { method: "GET" } },
      {
        path: "/medicines/42",
        init: { method: "PATCH", body: { unitPrice: "13.00" } },
      },
      { path: "/medicines/42/archive", init: { method: "POST" } },
    ])
  })
})
