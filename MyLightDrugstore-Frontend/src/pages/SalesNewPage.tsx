import { useState, useEffect } from "react"
import { useNavigate } from "../shared/router-compat"
import { mockApi } from "../shared/api/client"
import type { Medicine } from "../shared/api/types"
import { MockApiError } from "../shared/api/types"
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  Modal,
  Table,
  Th,
  Td,
  Tr,
  ErrorBanner,
  showToast,
  formatPHP,
  EmptyState,
  Spinner,
} from "../shared/ui"

export default function SalesNewPage() {
  const navigate = useNavigate()
  const [itemCode, setItemCode] = useState("")
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQ, setPickerQ] = useState("")
  const [pickerMeds, setPickerMeds] = useState<Medicine[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)

  const lookupByCode = async () => {
    setError("")
    const code = itemCode.trim()
    if (!code) {
      setError("Enter an item code.")
      return
    }
    try {
      const med = await mockApi.getMedicine(code)
      if (!med.active) {
        setError("This medicine is archived and unavailable.")
        return
      }
      setSelectedMed(med)
    } catch (e) {
      if (e instanceof MockApiError && e.status === 404)
        setError(`No medicine found with code "${code}".`)
      else setError("Lookup failed.")
    }
  }

  useEffect(() => {
    if (!pickerOpen) return
    setPickerLoading(true)
    const loadMedicines = async () => {
      try {
        const res = await mockApi.listMedicines({
          q: pickerQ,
          active: true,
          perPage: 20,
        })
        setPickerMeds(res.data)
      } catch {
        /* ignore */
      } finally {
        setPickerLoading(false)
      }
    }

    void loadMedicines()
  }, [pickerQ, pickerOpen])

  const addToSale = async () => {
    setError("")
    if (!selectedMed) {
      setError("Select a medicine first.")
      return
    }
    if (qty <= 0) {
      setError("Quantity must be at least 1.")
      return
    }
    if (qty > selectedMed.stockOnHand) {
      setError(`Only ${selectedMed.stockOnHand} units available.`)
      return
    }
    setLoading(true)
    try {
      const openSales = await mockApi.listSales({ state: "open", perPage: 1 })
      const openSale = openSales.data[0]
      if (openSale) {
        await mockApi.addSaleItem(
          openSale.id,
          { medicineId: selectedMed.id, quantity: qty },
          `add_${Date.now()}`,
        )
        showToast(`${selectedMed.genericName} added to cart.`)
      } else {
        await mockApi.createSale(
          [{ medicineId: selectedMed.id, quantity: qty }],
          `sale_${Date.now()}`,
        )
        showToast(`Sale created with ${selectedMed.genericName}.`)
      }
      navigate("/sales/cart")
    } catch (e) {
      if (e instanceof MockApiError) setError(e.apiError.message)
      else setError("Failed to add to sale.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New Sale"
        subtitle="Look up a medicine and add to cart"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Item code lookup */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Item Code Lookup
          </h2>
          <div className="flex gap-2 mb-3">
            <Input
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupByCode()}
              placeholder="Enter item code (e.g. med_001)"
              className="flex-1"
              autoFocus
            />
            <Button onClick={lookupByCode} variant="secondary">
              Lookup
            </Button>
          </div>
          <button
            onClick={() => {
              setPickerOpen(true)
              setPickerQ("")
            }}
            className="text-sm text-teal-600 hover:underline"
          >
            Or search by name →
          </button>
        </Card>

        {/* Selected medicine */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Selected Medicine
          </h2>
          {error && (
            <div className="mb-3">
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            </div>
          )}

          {!selectedMed ? (
            <div className="text-sm text-slate-400 text-center py-8">
              No medicine selected
            </div>
          ) : (
            <div>
              <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedMed.genericName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedMed.brandName}
                    </p>
                  </div>
                  <Badge
                    variant={selectedMed.stockOnHand < 30 ? "amber" : "green"}
                  >
                    {selectedMed.stockOnHand} units
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                  <span>
                    <strong className="text-slate-700">Form:</strong>{" "}
                    {selectedMed.dosageForm}
                  </span>
                  <span>
                    <strong className="text-slate-700">Strength:</strong>{" "}
                    {selectedMed.strength}
                  </span>
                  <span>
                    <strong className="text-slate-700">Location:</strong>{" "}
                    {selectedMed.storageLocation}
                  </span>
                  <span>
                    <strong className="text-slate-700">Unit Price:</strong>{" "}
                    <span className="font-mono font-semibold text-teal-700">
                      {formatPHP(selectedMed.unitPrice)}
                    </span>
                  </span>
                </div>
                {selectedMed.description && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedMed.description}
                  </p>
                )}
              </div>

              <div className="flex items-end gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  max={selectedMed.stockOnHand}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Line total</p>
                  <p className="font-mono font-bold text-lg text-slate-900">
                    {formatPHP(qty * parseFloat(selectedMed.unitPrice))}
                  </p>
                </div>
                <Button onClick={addToSale} loading={loading} size="lg">
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Medicine picker modal */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Medicine"
        size="lg"
      >
        <div className="mb-3">
          <Input
            value={pickerQ}
            onChange={(e) => setPickerQ(e.target.value)}
            placeholder="Search by name, brand, description..."
            autoFocus
          />
        </div>
        {pickerLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Item Code</Th>
                <Th>Generic Name</Th>
                <Th>Brand</Th>
                <Th>Form / Strength</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Price</Th>
              </tr>
            </thead>
            <tbody>
              {pickerMeds.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No medicines found" />
                  </td>
                </tr>
              )}
              {pickerMeds.map((m) => (
                <Tr
                  key={m.id}
                  onClick={() => {
                    setSelectedMed(m)
                    setItemCode(m.id)
                    setPickerOpen(false)
                  }}
                >
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
                      className={`font-mono font-medium text-sm ${
                        m.stockOnHand < 30 ? "text-amber-600" : "text-slate-700"
                      }`}
                    >
                      {m.stockOnHand}
                    </span>
                  </Td>
                  <Td className="text-right font-mono text-sm">
                    {formatPHP(m.unitPrice)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal>
    </div>
  )
}
