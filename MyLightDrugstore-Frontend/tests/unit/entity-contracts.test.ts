import assert from "node:assert/strict"
import { test } from "node:test"
import { createInventoryApi } from "@/entities/inventory"
import { createMedicineApi } from "@/entities/medicine"

test("medicine adapter maps catalog reads and mutations to Laravel routes", async () => {
  const calls: unknown[] = []
  const client = fakeClient(calls)
  const api = createMedicineApi(client)

  await api.list({ search: "paracetamol", page: 2 })
  await api.update("med-1", { name: "Paracetamol 500mg" })
  await api.archive("med-1")

  assert.deepEqual(calls, [
    { path: "/medicines?search=paracetamol&page=2", method: "GET" },
    { path: "/medicines/med-1", method: "PATCH", body: { name: "Paracetamol 500mg" } },
    { path: "/medicines/med-1/archive", method: "POST" },
  ])
})

test("inventory adapter maps receipt, adjustment, and movement requests", async () => {
  const calls: unknown[] = []
  const api = createInventoryApi(fakeClient(calls))

  await api.list({ medicineId: "med-1" })
  await api.receive({ medicineId: "med-1", quantity: 10, unitCost: 12.5 })
  await api.adjust({ medicineId: "med-1", quantity: -2, reason: "damaged" })
  await api.movements({ medicineId: "med-1" })

  assert.deepEqual(calls, [
    { path: "/inventory?medicineId=med-1", method: "GET" },
    {
      path: "/inventory/receipts",
      method: "POST",
      body: { medicineId: "med-1", quantity: 10, unitCost: 12.5 },
    },
    {
      path: "/inventory/adjustments",
      method: "POST",
      body: { medicineId: "med-1", quantity: -2, reason: "damaged" },
    },
    { path: "/inventory/movements?medicineId=med-1", method: "GET" },
  ])
})

function fakeClient(calls: unknown[]) {
  return {
    async request<T>(path: string, init: { method?: string; body?: unknown } = {}) {
      calls.push({ path, ...init })
      return { data: {} as T, status: 200, headers: new Headers() }
    },
  }
}
