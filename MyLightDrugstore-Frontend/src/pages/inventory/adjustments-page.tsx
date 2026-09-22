import { useState, useEffect } from "react"
import { createInventoryApi, type InventoryLot } from "@/entities/inventory"
import { createInventoryMutationActions } from "@/features/inventory-mutations"
import { normalizeApiError } from "@/shared/api"
import { apiClient } from "@/shared/api/api-client"
import {
  PageHeader,
  Button,
  Card,
  Select,
  Input,
  ErrorBanner,
  showToast,
  Spinner,
  formatDate,
} from "@/shared/ui"

const inventoryApi = createInventoryApi(apiClient.transport)
const inventoryActions = createInventoryMutationActions(inventoryApi)

type Reason = "stock_count" | "damage" | "expiry" | "correction"
type EnrichedLot = InventoryLot

interface AdjLine {
  lotId: string
  delta: number
}

const reasons: Record<Reason, string> = {
  stock_count: "Stock Count",
  damage: "Damage",
  expiry: "Expiry",
  correction: "Correction",
}

export default function InventoryAdjustmentsPage() {
  const [lots, setLots] = useState<EnrichedLot[]>([])
  const [reason, setReason] = useState<Reason>("stock_count")
  const [lines, setLines] = useState<AdjLine[]>([{ lotId: "", delta: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadLots = async () => {
      try {
        const result = await inventoryApi.lots({ available: true })
        setLots(result.data)
      } catch (cause: unknown) {
        setError(normalizeApiError(cause).message)
      }
    }
    void loadLots()
  }, [])

  const getLot = (id: string) => lots.find((lot) => String(lot.lotId) === id)
  const addLine = () => setLines((l) => [...l, { lotId: "", delta: 0 }])
  const removeLine = (i: number) =>
    setLines((l) => l.filter((_, idx) => idx !== i))
  const setField = <K extends keyof AdjLine>(i: number, k: K, v: AdjLine[K]) =>
    setLines((l) =>
      l.map((line, idx) => (idx === i ? { ...line, [k]: v } : line)),
    )

  const handleSubmit = async () => {
    setError("")
    for (const l of lines) {
      if (!l.lotId) {
        setError("Select a lot for each line.")
        return
      }
      if (l.delta === 0) {
        setError("Delta must be non-zero.")
        return
      }
      const lot = getLot(l.lotId)
      if (lot && lot.quantityRemaining + l.delta < 0) {
        setError(
          `Adjustment for lot ${l.lotId} would result in negative quantity (current: ${lot.quantityRemaining}, delta: ${l.delta}).`,
        )
        return
      }
    }
    setLoading(true)
    try {
      await inventoryActions.adjust({
        reason,
        items: lines.map((l) => ({
          lotId: Number(l.lotId),
          quantityDelta: l.delta,
        })),
      })
      showToast("Adjustment recorded successfully.")
      setLines([{ lotId: "", delta: 0 }])
      const result = await inventoryApi.lots({ available: true })
      setLots(result.data)
    } catch (cause: unknown) {
      setError(normalizeApiError(cause).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Record Adjustment"
        subtitle="Correct lot quantities with a reason"
      />

      <div className="max-w-2xl">
        <Card className="p-5">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            </div>
          )}

          <div className="mb-5">
            <Select
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
              className="max-w-xs"
            >
              {Object.entries(reasons).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
              <span className="col-span-7">Lot</span>
              <span className="col-span-3">Qty Delta</span>
              <span className="col-span-2"></span>
            </div>

            {lines.map((line, i) => {
              const lot = getLot(line.lotId)
              const newQty = lot ? lot.quantityRemaining + line.delta : null
              const invalid = newQty !== null && newQty < 0
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-lg p-3"
                >
                  <div className="col-span-7">
                    <Select
                      value={line.lotId}
                      onChange={(e) => setField(i, "lotId", e.target.value)}
                    >
                      <option value="">Select lot...</option>
                      {lots.map((l) => (
                        <option key={l.lotId} value={l.lotId}>
                          {l.genericName} ({l.brandName}) · Lot {l.lotId} · Exp{" "}
                          {formatDate(l.expiresAt)} · {l.quantityRemaining}{" "}
                          units
                        </option>
                      ))}
                    </Select>
                    {lot && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Current: {lot.quantityRemaining} → New:{" "}
                        <span
                          className={
                            invalid
                              ? "text-red-600 font-bold"
                              : "text-slate-700"
                          }
                        >
                          {newQty}
                        </span>
                        {invalid && " (cannot go below 0)"}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={line.delta}
                      onChange={(e) =>
                        setField(i, "delta", parseInt(e.target.value) || 0)
                      }
                      hint="Negative to reduce"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end pt-1">
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(i)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={addLine}>
              + Add Another Lot
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Record Adjustment
            </Button>
          </div>
        </Card>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-amber-800 mb-2">
            Adjustment Guidelines
          </h3>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>
              <strong>Stock Count</strong>: Use when physical count differs from
              system
            </li>
            <li>
              <strong>Damage</strong>: Medicines damaged and removed from
              inventory
            </li>
            <li>
              <strong>Expiry</strong>: Removing expired stock from active lots
            </li>
            <li>
              <strong>Correction</strong>: General data correction with
              documented reason
            </li>
            <li>Adjustments cannot make lot quantity go below zero</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
