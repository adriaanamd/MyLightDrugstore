import { useState, useEffect } from "react"
import { createInventoryApi, type InventoryLot } from "@/entities/inventory"
import { createMedicineApi, type Medicine } from "@/entities/medicine"
import { apiClient } from "@/shared/api/api-client"
import {
  PageHeader,
  Button,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Select,
  formatPHP,
  formatDate,
  EmptyState,
} from "@/shared/ui"

const inventoryApi = createInventoryApi(apiClient.transport)
const medicineApi = createMedicineApi(apiClient.transport)

type EnrichedLot = InventoryLot

export default function ReportsInventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [expiringLots, setExpiringLots] = useState<EnrichedLot[]>([])
  const [threshold, setThreshold] = useState(30)
  const [tab, setTab] = useState<"all" | "low" | "expiring">("all")
  const [expiresBefore, setExpiresBefore] = useState("")

  const load = async () => {
    try {
      const [medicineResult, lotResult] = await Promise.all([
        medicineApi.list({
          active: true,
          lowStock: tab === "low" ? true : undefined,
          perPage: 100,
        }),
        inventoryApi.lots({
          available: true,
          expiresBefore: expiresBefore || undefined,
          perPage: 100,
        }),
      ])
      setMedicines(medicineResult.data)
      setExpiringLots(lotResult.data)
      setThreshold(30)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load()
  }, [tab, expiresBefore])

  const today = new Date().toISOString().split("T")[0]
  const soon = new Date()
  soon.setDate(soon.getDate() + 30)
  const soonStr = soon.toISOString().split("T")[0]

  return (
    <div>
      <PageHeader
        title="Inventory Report"
        subtitle="Stock status, low-stock, and expiring lots"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="no-print"
          >
            🖨 Print
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Tabs + filters */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["all", "low", "expiring"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  tab === t
                    ? "bg-white shadow-sm text-slate-800 border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "low"
                  ? `Low Stock (<${threshold})`
                  : t === "expiring"
                    ? "Expiring Soon"
                    : "All Medicines"}
              </button>
            ))}
          </div>
          {tab === "expiring" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Expires before:</span>
              <input
                type="date"
                value={expiresBefore}
                onChange={(e) => setExpiresBefore(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1"
              />
              {!expiresBefore && (
                <span className="text-xs text-slate-400">
                  (default: 30 days)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">
            MyLight Drugstore – Inventory Report
          </h1>
          <p className="text-sm text-slate-500">
            Generated:{" "}
            {new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
          </p>
        </div>

        {tab !== "expiring" ? (
          <Card>
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">
                {tab === "low"
                  ? `Low Stock Medicines (< ${threshold} units)`
                  : "All Active Medicines"}
                <span className="ml-2 text-slate-400 font-normal">
                  {medicines.length} items
                </span>
              </h2>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Item Code</Th>
                  <Th>Generic Name</Th>
                  <Th>Brand</Th>
                  <Th>Form / Strength</Th>
                  <Th className="text-right">Stock on Hand</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No medicines in this category" />
                    </td>
                  </tr>
                )}
                {medicines.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <span className="font-mono text-xs text-slate-400">
                        {m.id}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-800">
                        {m.genericName}
                      </span>
                    </Td>
                    <Td className="text-slate-500">{m.brandName}</Td>
                    <Td className="text-xs text-slate-400">
                      {m.dosageForm} · {m.strength}
                    </Td>
                    <Td className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          m.stockOnHand < threshold
                            ? "text-amber-600"
                            : m.stockOnHand === 0
                              ? "text-red-500"
                              : "text-slate-700"
                        }`}
                      >
                        {m.stockOnHand}
                      </span>
                    </Td>
                    <Td className="text-right font-mono text-sm">
                      {formatPHP(m.unitPrice)}
                    </Td>
                    <Td className="text-xs text-slate-400">
                      {m.storageLocation}
                    </Td>
                    <Td>
                      {m.stockOnHand === 0 ? (
                        <Badge variant="red">Out of Stock</Badge>
                      ) : m.stockOnHand < threshold ? (
                        <Badge variant="amber">Low Stock</Badge>
                      ) : (
                        <Badge variant="green">In Stock</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        ) : (
          <Card>
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">
                Expiring Lots
                <span className="ml-2 text-slate-400 font-normal">
                  {expiringLots.length} lots
                </span>
              </h2>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Lot ID</Th>
                  <Th>Generic Name</Th>
                  <Th>Brand</Th>
                  <Th className="text-right">Quantity</Th>
                  <Th>Expires</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {expiringLots.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="No expiring lots found" />
                    </td>
                  </tr>
                )}
                {expiringLots.map((lot) => {
                  const expired = lot.expiresAt < today
                  const expiringSoon = !expired && lot.expiresAt <= soonStr
                  return (
                    <Tr key={lot.lotId}>
                      <Td>
                        <span className="font-mono text-xs text-slate-400">
                          {lot.lotId}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-slate-800">
                          {lot.genericName}
                        </span>
                      </Td>
                      <Td className="text-slate-500">{lot.brandName}</Td>
                      <Td className="text-right font-mono font-semibold">
                        {lot.quantityRemaining}
                      </Td>
                      <Td>
                        <span
                          className={`font-medium ${
                            expired
                              ? "text-red-600"
                              : expiringSoon
                                ? "text-amber-600"
                                : "text-slate-600"
                          }`}
                        >
                          {formatDate(lot.expiresAt)}
                        </span>
                      </Td>
                      <Td>
                        {expired ? (
                          <Badge variant="red">Expired</Badge>
                        ) : expiringSoon ? (
                          <Badge variant="amber">Expiring Soon</Badge>
                        ) : (
                          <Badge variant="green">Available</Badge>
                        )}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
