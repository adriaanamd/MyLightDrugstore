import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { createInventoryApi, type InventoryLot } from "@/entities/inventory"
import { apiClient } from "@/shared/api/api-client"
import {
  StatCard,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  PageHeader,
  Button,
  EmptyState,
  Spinner,
  formatDate,
} from "@/shared/ui"

const inventoryApi = createInventoryApi(apiClient.transport)

type InventoryOverview = {
  medicineCount: number

  totalStockUnits: number

  lowStockCount: number

  expiringSoonCount: number

  expiredLotsCount: number
}

type EnrichedLot = InventoryLot

export default function InventoryPage() {
  const [overview, setOverview] = useState<InventoryOverview | null>(null)
  const [lots, setLots] = useState<EnrichedLot[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "low" | "expiring" | "expired">("all")

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const [inventorySummary, inventoryLots] = await Promise.all([
          inventoryApi.summary({ perPage: 100 }),
          inventoryApi.lots({}),
        ])
        setOverview({
          medicineCount: inventorySummary.meta.total,
          totalStockUnits: inventorySummary.data.reduce(
            (total, item) => total + item.stockOnHand,
            0,
          ),
          lowStockCount: inventorySummary.data.filter((item) => item.lowStock)
            .length,
          expiringSoonCount: inventorySummary.data.filter(
            (item) => item.earliestExpiry !== null,
          ).length,
          expiredLotsCount: inventoryLots.data.filter(
            (lot) => lot.expiresAt < new Date().toISOString().split("T")[0],
          ).length,
        })
        setLots(inventoryLots.data)
      } catch {
        setLots([])
      } finally {
        setLoading(false)
      }
    }

    void loadInventory()
  }, [])

  const today = new Date().toISOString().split("T")[0]
  const soonDate = new Date()
  soonDate.setDate(soonDate.getDate() + 30)
  const soon = soonDate.toISOString().split("T")[0]

  const threshold = 30

  const stockMap: Record<string, number> = {}
  lots.forEach((lot) => {
    stockMap[lot.medicineId] =
      (stockMap[lot.medicineId] ?? 0) + lot.quantityRemaining
  })

  const filteredLots = lots.filter((l) => {
    if (tab === "low") {
      const stock = stockMap[l.medicineId] ?? 0
      return stock < threshold
    }
    if (tab === "expiring")
      return (
        l.expiresAt >= today && l.expiresAt <= soon && l.quantityRemaining > 0
      )
    if (tab === "expired") return l.expiresAt < today
    return true
  })

  function lotBadge(lot: EnrichedLot) {
    if (lot.expiresAt < today) return <Badge variant="red">Expired</Badge>
    if (lot.expiresAt <= soon && lot.quantityRemaining > 0)
      return <Badge variant="amber">Expiring Soon</Badge>
    if (lot.quantityRemaining === 0)
      return <Badge variant="gray">Depleted</Badge>
    return <Badge variant="green">Available</Badge>
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )

  return (
    <div>
      <PageHeader
        title="Stock Overview"
        subtitle="Current inventory status"
        action={
          <div className="flex gap-2">
            <Link to={"/inventory/receipts" as never}>
              <Button variant="secondary" size="sm">
                Receive Stock
              </Button>
            </Link>
            <Link to={"/inventory/adjustments" as never}>
              <Button variant="outline" size="sm">
                Adjustments
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Active Medicines"
          value={overview?.medicineCount ?? 0}
          color="navy"
        />
        <StatCard
          label="Total Units"
          value={(overview?.totalStockUnits ?? 0).toLocaleString()}
          color="teal"
        />
        <StatCard
          label="Low Stock"
          value={overview?.lowStockCount ?? 0}
          color="amber"
          sub={`< ${threshold} units`}
        />
        <StatCard
          label="Expiring (30d)"
          value={overview?.expiringSoonCount ?? 0}
          color="amber"
        />
        <StatCard
          label="Expired Lots"
          value={overview?.expiredLotsCount ?? 0}
          color="red"
        />
      </div>

      <Card>
        <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-200 bg-slate-50">
          {(["all", "low", "expiring", "expired"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-white shadow-sm text-slate-800 border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "low"
                ? "Low Stock"
                : t === "expiring"
                  ? "Expiring Soon"
                  : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Lot ID</Th>
              <Th>Generic Name</Th>
              <Th>Brand</Th>
              <Th className="text-right">Initial Qty</Th>
              <Th className="text-right">Remaining</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filteredLots.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title={`No lots in ${
                      tab === "all" ? "inventory" : tab + " category"
                    }`}
                  />
                </td>
              </tr>
            )}
            {filteredLots.map((lot) => (
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
                <Td className="text-slate-500 text-xs">{lot.brandName}</Td>
                <Td className="text-right font-mono text-slate-500 text-sm">
                  {lot.quantityReceived}
                </Td>
                <Td className="text-right">
                  <span
                    className={`font-mono font-semibold text-sm ${
                      lot.quantityRemaining === 0
                        ? "text-slate-300"
                        : lot.expiresAt < today
                          ? "text-red-500"
                          : stockMap[lot.medicineId] < threshold
                            ? "text-amber-600"
                            : "text-slate-700"
                    }`}
                  >
                    {lot.quantityRemaining}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`text-sm ${
                      lot.expiresAt < today
                        ? "text-red-600 font-medium"
                        : lot.expiresAt <= soon
                          ? "text-amber-600 font-medium"
                          : "text-slate-600"
                    }`}
                  >
                    {formatDate(lot.expiresAt)}
                  </span>
                </Td>
                <Td>{lotBadge(lot)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
