import { useState, useEffect } from "react"
import { Link } from "@/shared/router-compat"
import {
  createSaleApi,
  type PaymentStatus,
  type Sale,
  type SaleState,
} from "@/entities/sale"
import { apiClient } from "@/shared/api/api-client"
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Input,
  Select,
  Modal,
  Button,
  formatPHP,
  formatDateTime,
  Pagination,
  EmptyState,
  Spinner,
} from "@/shared/ui"

const saleApi = createSaleApi(apiClient.transport)

function stateBadge(sale: Sale) {
  if (sale.state === "cancelled") return <Badge variant="gray">Cancelled</Badge>
  if (sale.state === "completed")
    return <Badge variant="green">Completed</Badge>
  return <Badge variant="teal">Open</Badge>
}

function payBadge(sale: Sale) {
  if (sale.state === "cancelled") return null
  return sale.paymentStatus === "paid" ? (
    <Badge variant="green">Paid</Badge>
  ) : (
    <Badge variant="amber">Unpaid</Badge>
  )
}

export default function SalesListPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState<"" | SaleState>("")
  const [payFilter, setPayFilter] = useState<"" | PaymentStatus>("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Sale | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const result = await saleApi.list({
        state: stateFilter || undefined,
        paymentStatus: payFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        perPage: 25,
      })
      setSales(result.data)
      setTotal(result.meta.total)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [stateFilter, payFilter, fromDate, toDate])
  useEffect(() => {
    void load()
  }, [page, stateFilter, payFilter, fromDate, toDate])

  return (
    <div>
      <PageHeader
        title="Sale History"
        subtitle={`${total} sales`}
        action={
          <Link to="/sales/new">
            <Button size="sm">+ New Sale</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as "" | SaleState)}
            className="w-32"
          >
            <option value="">All states</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value as "" | PaymentStatus)}
            className="w-32"
          >
            <option value="">All payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36"
            />
            <span className="text-slate-400 text-xs">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36"
            />
          </div>
          {(stateFilter || payFilter || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStateFilter("")
                setPayFilter("")
                setFromDate("")
                setToDate("")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Sale ID</Th>
                  <Th>Date / Time</Th>
                  <Th>Items</Th>
                  <Th>Created By</Th>
                  <Th>State</Th>
                  <Th>Payment</Th>
                  <Th className="text-right">Grand Total</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-sm text-slate-400"
                    >
                      No sales found. Try adjusting filters.
                    </td>
                  </tr>
                )}
                {sales.map((sale) => (
                  <Tr key={sale.id} onClick={() => setDetail(sale)}>
                    <Td>
                      <span className="font-mono text-xs text-slate-500">
                        {sale.id}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </Td>
                    <Td>
                      {sale.items?.filter((item) => item.state === "active")
                        .length ?? 0}
                    </Td>
                    <Td className="text-xs text-slate-600">
                      {sale.createdByName}
                    </Td>
                    <Td>{stateBadge(sale)}</Td>
                    <Td>{payBadge(sale)}</Td>
                    <Td className="text-right font-mono font-semibold text-slate-800">
                      {formatPHP(sale.grandTotal)}
                    </Td>
                    <Td>
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setDetail(sale)}
                          className="text-xs text-teal-600 hover:underline"
                        >
                          View
                        </button>
                        {sale.state !== "cancelled" && (
                          <Link
                            to={`/sales/print/${sale.id}`}
                            target="_blank"
                            className="text-xs text-slate-500 hover:underline"
                          >
                            Print
                          </Link>
                        )}
                        {sale.state === "open" && (
                          <Link
                            to="/sales/cart"
                            className="text-xs text-navy-600 hover:underline"
                          >
                            Cart
                          </Link>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-3">
              <Pagination
                page={page}
                perPage={25}
                total={total}
                onPage={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Sale detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Sale Detail: ${detail?.id}`}
        size="xl"
        footer={
          <div className="flex items-center gap-2 w-full">
            {detail && detail.state !== "cancelled" && (
              <Link to={`/sales/print/${detail.id}`} target="_blank">
                <Button variant="outline" size="sm">
                  🖨 Print
                </Button>
              </Link>
            )}
            {detail?.state === "open" && (
              <Link to="/sales/cart">
                <Button size="sm">Open Cart</Button>
              </Link>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">State:</span>{" "}
                {stateBadge(detail)}
              </div>
              <div>
                <span className="text-slate-500">Payment:</span>{" "}
                {payBadge(detail)}
              </div>
              <div>
                <span className="text-slate-500">Created by:</span>{" "}
                {detail.createdByName}
              </div>
              <div>
                <span className="text-slate-500">Created:</span>{" "}
                {formatDateTime(detail.createdAt)}
              </div>
              {detail.completedAt && (
                <div>
                  <span className="text-slate-500">Completed:</span>{" "}
                  {formatDateTime(detail.completedAt)}
                </div>
              )}
              {detail.cancelledAt && (
                <div>
                  <span className="text-slate-500">Cancelled:</span>{" "}
                  {formatDateTime(detail.cancelledAt)}
                </div>
              )}
              {detail.cancellationReason && (
                <div>
                  <span className="text-slate-500">Cancel reason:</span>{" "}
                  {detail.cancellationReason}
                </div>
              )}
            </div>

            <Table>
              <thead>
                <tr>
                  <Th>Medicine</Th>
                  <Th>Brand</Th>
                  <Th>Form / Strength</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th className="text-right">Line Total</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {(detail.items ?? []).map((item) => (
                  <Tr
                    key={item.id}
                    className={item.state !== "active" ? "opacity-50" : ""}
                  >
                    <Td>
                      <span
                        className={`font-medium ${
                          item.state !== "active"
                            ? "line-through text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {item.genericName}
                      </span>
                    </Td>
                    <Td className="text-slate-500">{item.brandName}</Td>
                    <Td className="text-xs text-slate-400">
                      {item.dosageForm} · {item.strength}
                    </Td>
                    <Td className="text-right font-mono">{item.quantity}</Td>
                    <Td className="text-right font-mono text-sm">
                      {formatPHP(item.unitPrice)}
                    </Td>
                    <Td className="text-right font-mono font-semibold text-slate-800">
                      {formatPHP(item.lineTotal)}
                    </Td>
                    <Td>
                      {item.state !== "active" ? (
                        <Badge variant="gray">Removed</Badge>
                      ) : (
                        <Badge variant="green">Active</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500">Grand Total</p>
                <p className="font-mono font-bold text-2xl text-slate-900">
                  {formatPHP(detail.grandTotal)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
