import { useState, useEffect } from "react"
import { useSearchParams } from "@/shared/router-compat"
import { createInventoryApi } from "@/entities/inventory"
import { createMedicineApi, type Medicine } from "@/entities/medicine"
import { createInventoryMutationActions } from "@/features/inventory-mutations"
import { normalizeApiError } from "@/shared/api"
import { apiClient } from "@/shared/api/api-client"
import {
  PageHeader,
  Button,
  Card,
  Input,
  Select,
  ErrorBanner,
  showToast,
  Spinner,
  formatPHP,
} from "@/shared/ui"

const medicineApi = createMedicineApi(apiClient.transport)
const inventoryActions = createInventoryMutationActions(
  createInventoryApi(apiClient.transport),
)

interface ReceiptLine {
  medicineId: string
  quantity: number
  expiresAt: string
}

export default function InventoryReceiptsPage() {
  const [searchParams] = useSearchParams()
  const prefillMedId = searchParams.get("medicineId")

  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [lines, setLines] = useState<ReceiptLine[]>([
    { medicineId: prefillMedId ?? "", quantity: 1, expiresAt: "" },
  ])
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const res = await medicineApi.list({ active: true, perPage: 100 })
        setMedicines(res.data)
      } catch (cause: unknown) {
        setError(normalizeApiError(cause).message)
      }
    }

    void loadMedicines()
  }, [])

  const addLine = () =>
    setLines((l) => [...l, { medicineId: "", quantity: 1, expiresAt: "" }])
  const removeLine = (i: number) =>
    setLines((l) => l.filter((_, idx) => idx !== i))
  const setLine = <K extends keyof ReceiptLine,>(
    i: number,
    k: K,
    v: ReceiptLine[K],
  ) =>
    setLines((l) =>
      l.map((line, idx) => (idx === i ? { ...line, [k]: v } : line)),
    )

  const handleSubmit = async () => {
    setError("")
    for (const l of lines) {
      if (!l.medicineId) {
        setError("Select a medicine for each line.")
        return
      }
      if (l.quantity <= 0) {
        setError("Quantity must be positive.")
        return
      }
      if (!l.expiresAt) {
        setError("Expiry date is required for each lot.")
        return
      }
    }
    setLoading(true)
    try {
      await inventoryActions.receive({
        receivedAt: new Date(receivedAt).toISOString(),
        items: lines.map((l) => ({
          medicineId: Number(l.medicineId),
          quantity: l.quantity,
          expiresAt: l.expiresAt,
        })),
      })
      showToast("Stock received successfully.")
      setSuccess(true)
      setLines([{ medicineId: "", quantity: 1, expiresAt: "" }])
    } catch (cause: unknown) {
      setError(normalizeApiError(cause).message)
    } finally {
      setLoading(false)
    }
  }

  const getMed = (id: string) =>
    medicines.find((medicine) => String(medicine.id) === id)

  return (
    <div>
      <PageHeader
        title="Receive Stock"
        subtitle="Record incoming stock into dated lots"
      />

      <div className="max-w-2xl">
        <Card className="p-5">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <span>✓</span> Stock received and lots created. Stock totals have
              been updated.
              <button
                onClick={() => setSuccess(false)}
                className="ml-auto text-emerald-500 hover:text-emerald-700"
              >
                ✕
              </button>
            </div>
          )}

          <div className="mb-5">
            <Input
              label="Receipt Date"
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
              <span className="col-span-5">Medicine</span>
              <span className="col-span-2 text-right">Quantity</span>
              <span className="col-span-3">Expiry Date</span>
              <span className="col-span-2"></span>
            </div>

            {lines.map((line, i) => {
              const med = getMed(line.medicineId)
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-lg p-3"
                >
                  <div className="col-span-5">
                    <Select
                      value={line.medicineId}
                      onChange={(e) => setLine(i, "medicineId", e.target.value)}
                    >
                      <option value="">Select medicine...</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.genericName} ({m.brandName}) – {m.strength}
                        </option>
                      ))}
                    </Select>
                    {med && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Current stock: {med.stockOnHand} · Unit price:{" "}
                        {formatPHP(med.unitPrice)}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        setLine(i, "quantity", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="date"
                      value={line.expiresAt}
                      onChange={(e) => setLine(i, "expiresAt", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end pt-1">
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(i)}
                        className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
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
              + Add Another Medicine
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setLines([{ medicineId: "", quantity: 1, expiresAt: "" }])
                }
              >
                Clear
              </Button>
              <Button onClick={handleSubmit} loading={loading}>
                Receive Stock
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-4 bg-navy-50 border border-navy-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-navy-700 mb-2">
            How this works
          </h3>
          <ul className="text-xs text-navy-600 space-y-1 list-disc list-inside">
            <li>Each line creates a new lot with the specified expiry date</li>
            <li>
              The quantity is added to existing stock — it does not replace the
              total
            </li>
            <li>
              Lots are consumed using first-expiring-first-out (FEFO) order
              during sales
            </li>
            <li>Each lot is tracked separately for expiry management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
