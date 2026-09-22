import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { createInventoryApi, type InventorySummary } from "@/entities/inventory"
import { createMedicineApi, type Medicine } from "@/entities/medicine"
import { createSaleApi, type Sale } from "@/entities/sale"
import { apiClient } from "@/shared/api/api-client"
import { normalizeApiError, type ApiError } from "@/shared/api"
import {
  PageHeader,
  StatCard,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  formatPHP,
  formatDateTime,
  Input,
  Spinner,
  EmptyState,
  ErrorBanner,
} from "@/shared/ui"

const inventoryApi = createInventoryApi(apiClient.transport)
const medicineApi = createMedicineApi(apiClient.transport)
const saleApi = createSaleApi(apiClient.transport)

type DashboardOverview = {
  medicineCount: number

  totalStockUnits: number

  lowStockCount: number

  expiringSoonCount: number
}

function saleBadge(sale: Sale) {
  if (sale.state === "cancelled") return <Badge variant="gray">Cancelled</Badge>
  if (sale.paymentStatus === "unpaid")
    return <Badge variant="amber">Unpaid</Badge>
  return <Badge variant="green">Paid</Badge>
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [searchQ, setSearchQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const load = async () => {
    setError(null)
    try {
      const [inventoryResult, medResult, salesResult] = await Promise.all([
        inventoryApi.summary({ perPage: 100 }),
        medicineApi.list({ q: searchQ, active: true, perPage: 20 }),
        saleApi.list({ perPage: 6 }),
      ])

      setOverview(
        createOverview(inventoryResult.data, inventoryResult.meta.total),
      )
      setMedicines(medResult.data)
      setRecentSales(salesResult.data)
    } catch (cause: unknown) {
      setError(normalizeApiError(cause))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQ])

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )

  const unpaidCount = recentSales.filter(
    (s) => s.paymentStatus === "unpaid" && s.state === "open",
  ).length
  const todaySales = recentSales.filter((s) => {
    const d = new Date(s.createdAt).toDateString()
    return d === new Date().toDateString() && s.state === "completed"
  })
  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + parseFloat(s.grandTotal),
    0,
  )

  return (
    <div>
      {error && <ErrorBanner message={error.message} />}
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview"
        action={
          <Link
            to={"/sales/new" as never}
            className="inline-flex items-center gap-1.5 bg-teal-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Sale
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Active Medicines"
          value={overview?.medicineCount ?? 0}
          color="navy"
        />
        <StatCard
          label="Total Stock Units"
          value={(overview?.totalStockUnits ?? 0).toLocaleString()}
          color="teal"
        />
        <StatCard
          label="Low Stock Items"
          value={overview?.lowStockCount ?? 0}
          color={overview && overview.lowStockCount > 0 ? "amber" : "default"}
          sub="< 30 units"
        />
        <StatCard
          label="Expiring (30 days)"
          value={overview?.expiringSoonCount ?? 0}
          color={
            overview && overview.expiringSoonCount > 0 ? "amber" : "default"
          }
        />
        <StatCard
          label="Open / Unpaid"
          value={unpaidCount}
          color={unpaidCount > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Today's Revenue"
          value={formatPHP(todayRevenue)}
          color="teal"
          sub={`${todaySales.length} sales`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Medicine table */}
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">
                Medicine Catalog
              </h2>
              <div className="flex items-center gap-2">
                <Input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search..."
                  className="!py-1 !text-xs w-40"
                />
                <Link
                  to={"/catalog/medicines" as never}
                  className="text-xs text-teal-600 hover:underline whitespace-nowrap"
                >
                  View all
                </Link>
              </div>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Item Code</Th>
                  <Th>Generic Name</Th>
                  <Th>Brand</Th>
                  <Th>Form / Strength</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th>Location</Th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState title="No medicines found" />
                    </td>
                  </tr>
                )}
                {medicines.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <span className="font-mono text-xs text-slate-500">
                        {m.id}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-800">
                        {m.genericName}
                      </span>
                    </Td>
                    <Td className="text-slate-500">{m.brandName}</Td>
                    <Td className="text-slate-500 text-xs">
                      {m.dosageForm} · {m.strength}
                    </Td>
                    <Td className="text-right">
                      <span
                        className={`font-mono font-medium text-xs ${
                          m.stockOnHand < 30
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {m.stockOnHand}
                        {m.stockOnHand < 30 && (
                          <span className="ml-1 text-[10px]">⚠</span>
                        )}
                      </span>
                    </Td>
                    <Td className="text-right font-mono text-xs">
                      {formatPHP(m.unitPrice)}
                    </Td>
                    <Td className="text-xs text-slate-400">
                      {m.storageLocation ?? "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        {/* Recent sales */}
        <div>
          <Card>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 text-sm">
                Recent Sales
              </h2>
              <Link
                to={"/sales" as never}
                className="text-xs text-teal-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSales.length === 0 && <EmptyState title="No sales yet" />}
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-xs text-slate-400">
                      {sale.id}
                    </span>
                    {saleBadge(sale)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {sale.createdByName ?? String(sale.createdBy)}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-800">
                      {formatPHP(sale.grandTotal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateTime(sale.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              {
                label: "Receive Stock",
                to: "/inventory/receipts",
                color: "bg-navy-700",
              },
              {
                label: "Low Stock",
                to: "/reports/inventory",
                color: "bg-amber-600",
              },
              { label: "Inventory", to: "/inventory", color: "bg-teal-600" },
              { label: "Reports", to: "/reports/sales", color: "bg-slate-600" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to as never}
                className={`${a.color} text-white text-xs font-medium px-3 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-center`}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function createOverview(
  inventory: InventorySummary[],
  medicineCount: number,
): DashboardOverview {
  const expiryCutoff = new Date()
  expiryCutoff.setDate(expiryCutoff.getDate() + 30)

  return {
    medicineCount,
    totalStockUnits: inventory.reduce(
      (total, item) => total + item.stockOnHand,
      0,
    ),
    lowStockCount: inventory.filter((item) => item.lowStock).length,
    expiringSoonCount: inventory.filter((item) => {
      if (item.earliestExpiry === null) {
        return false
      }

      return new Date(item.earliestExpiry) <= expiryCutoff
    }).length,
  }
}
