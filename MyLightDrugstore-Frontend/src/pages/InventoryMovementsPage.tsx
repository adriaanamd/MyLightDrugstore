import { useState, useEffect } from "react"
import { mockApi } from "../shared/api/client"
import type { Movement } from "../shared/api/types"
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
  Pagination,
  EmptyState,
  Spinner,
  formatDateTime,
} from "../shared/ui"

const movementLabels: Record<string, string> = {
  receipt: "Receipt",
  sale: "Sale",
  adjustment: "Adjustment",
  sale_removal: "Sale Removal",
  cancellation: "Cancellation",
}

function movementBadge(type: string) {
  if (type === "receipt") return <Badge variant="teal">Receipt</Badge>
  if (type === "sale") return <Badge variant="navy">Sale</Badge>
  if (type === "adjustment") return <Badge variant="amber">Adjustment</Badge>
  if (type === "sale_removal" || type === "cancellation")
    return <Badge variant="gray">Reversal</Badge>
  return <Badge variant="gray">{type}</Badge>
}

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMovements = async () => {
      setLoading(true)
      try {
        const result = await mockApi.listMovements({
          type: typeFilter || undefined,
          page,
          perPage: 25,
        })
        let data = result.data
        if (q) {
          const lq = q.toLowerCase()
          data = data.filter(
            (m) =>
              m.genericName.toLowerCase().includes(lq) ||
              m.medicineId.includes(lq) ||
              m.actorName.toLowerCase().includes(lq) ||
              m.lotId.includes(lq),
          )
        }
        setMovements(data)
        setTotal(result.meta.total)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }

    void loadMovements()
  }, [page, typeFilter, q])

  return (
    <div>
      <PageHeader
        title="Stock Movement History"
        subtitle="Read-only audit log of all inventory changes"
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicine, actor..."
            className="w-52"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          >
            <option value="">All types</option>
            {Object.entries(movementLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
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
                  <Th>Date / Time</Th>
                  <Th>Type</Th>
                  <Th>Medicine</Th>
                  <Th>Lot ID</Th>
                  <Th className="text-right">Delta</Th>
                  <Th>Reason</Th>
                  <Th>Reference</Th>
                  <Th>Actor</Th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No movements found" />
                    </td>
                  </tr>
                )}
                {movements.map((mv) => (
                  <Tr key={mv.id}>
                    <Td className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(mv.createdAt)}
                    </Td>
                    <Td>{movementBadge(mv.type)}</Td>
                    <Td>
                      <span className="font-medium text-slate-800">
                        {mv.genericName}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-400">
                        {mv.lotId}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={`font-mono font-semibold text-sm ${
                          mv.quantityDelta > 0
                            ? "text-teal-600"
                            : "text-red-500"
                        }`}
                      >
                        {mv.quantityDelta > 0 ? "+" : ""}
                        {mv.quantityDelta}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-500 capitalize">
                      {mv.reason ?? "—"}
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-400">
                        {mv.referenceId ?? "—"}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-600">{mv.actorName}</Td>
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
    </div>
  )
}
