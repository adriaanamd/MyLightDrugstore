import assert from "node:assert/strict"
import { test } from "node:test"
import { createInventoryApi } from "@/entities/inventory"
import { createMedicineApi } from "@/entities/medicine"
import { createBackupApi } from "@/entities/backup"
import { createReportApi } from "@/entities/report"
import { createSaleApi } from "@/entities/sale"

test("medicine adapter maps catalog reads and mutations to Laravel routes", async () => {
  const calls: unknown[] = []
  const client = fakeClient(calls)
  const api = createMedicineApi(client)

  await api.list({ search: "paracetamol", page: 2 })
  await api.update("med-1", { name: "Paracetamol 500mg" })
  await api.archive("med-1")

  assert.deepEqual(calls, [
    { path: "/medicines?search=paracetamol&page=2", method: "GET" },
    {
      path: "/medicines/med-1",
      method: "PATCH",
      body: { name: "Paracetamol 500mg" },
    },
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

test("sale adapter maps sale lifecycle requests", async () => {
  const calls: unknown[] = []
  const api = createSaleApi(fakeClient(calls))

  await api.list({ status: "open" })
  await api.create({
    customerName: "Walk-in",
    items: [{ medicineId: "med-1", quantity: 2 }],
  }, "sale-key")
  await api.addItem("sale-1", { medicineId: "med-2", quantity: 1 }, "item-key")
  await api.removeItem("sale-1", "item-1")
  await api.markPaid("sale-1")
  await api.cancel("sale-1", "duplicate")

  assert.deepEqual(calls, [
    { path: "/sales?status=open", method: "GET" },
    {
      path: "/sales",
      method: "POST",
      headers: { "Idempotency-Key": "sale-key" },
      body: {
        customerName: "Walk-in",
        items: [{ medicineId: "med-1", quantity: 2 }],
      },
    },
    {
      path: "/sales/sale-1/items",
      method: "POST",
      headers: { "Idempotency-Key": "item-key" },
      body: { medicineId: "med-2", quantity: 1 },
    },
    { path: "/sales/sale-1/items/item-1", method: "DELETE" },
    { path: "/sales/sale-1/mark-paid", method: "POST" },
    {
      path: "/sales/sale-1/cancel",
      method: "POST",
      body: { reason: "duplicate" },
    },
  ])
})

test("report and backup adapters map filters and binary downloads", async () => {
  const calls: unknown[] = []
  const reportApi = createReportApi(fakeClient(calls))
  const backupApi = createBackupApi(fakeClient(calls))

  await reportApi.inventory({ from: "2026-01-01", to: "2026-01-31" })
  await reportApi.sales({
    from: "2026-01-01",
    to: "2026-01-31",
    status: "paid",
  })
  await backupApi.create()
  await backupApi.show("backup-1")
  await backupApi.download("backup-1")

  assert.deepEqual(calls, [
    { path: "/reports/inventory?from=2026-01-01&to=2026-01-31", method: "GET" },
    {
      path: "/reports/sales?from=2026-01-01&to=2026-01-31&status=paid",
      method: "GET",
    },
    { path: "/backups", method: "POST" },
    { path: "/backups/backup-1", method: "GET" },
    { path: "/backups/backup-1/download", method: "GET" },
  ])
})

function fakeClient(calls: unknown[]) {
  return {
    async request<T,>(
      path: string,
      init: {
        method?: string
        body?: unknown
      } = {},
    ) {
      calls.push({ path, ...init })
      return { data: {} as T, status: 200, headers: new Headers() }
    },
  }
}
