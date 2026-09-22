import { useState, useEffect } from "react"
import { mockApi } from "../shared/api/client"
import type { Medicine } from "../shared/api/types"
import { MockApiError } from "../shared/api/types"
import {
  PageHeader,
  Button,
  Badge,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  Pagination,
  EmptyState,
  formatPHP,
  showToast,
  ErrorBanner,
  Spinner,
} from "../shared/ui"

interface MedForm {
  genericName: string
  brandName: string
  description: string
  dosageForm: string
  strength: string
  unitPrice: string
  storageLocation: string
}

const emptyForm: MedForm = {
  genericName: "",
  brandName: "",
  description: "",
  dosageForm: "",
  strength: "",
  unitPrice: "",
  storageLocation: "",
}

interface StockForm {
  quantity: number
  expiresAt: string
}

export default function CatalogPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQ, setSearchQ] = useState("")
  const [activeFilter, setActiveFilter] =
    useState<"active" | "archived" | "all">("active")
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editMed, setEditMed] = useState<Medicine | null>(null)
  const [form, setForm] = useState<MedForm>(emptyForm)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)

  const [stockMed, setStockMed] = useState<Medicine | null>(null)
  const [stockForm, setStockForm] = useState<StockForm>({
    quantity: 1,
    expiresAt: "",
  })
  const [stockError, setStockError] = useState("")
  const [stockLoading, setStockLoading] = useState(false)

  const [archiveMed, setArchiveMed] = useState<Medicine | null>(null)
  const [archiveLoading, setArchiveLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const active =
        activeFilter === "active"
          ? true
          : activeFilter === "archived"
            ? false
            : undefined
      const result = await mockApi.listMedicines({
        q: searchQ,
        active,
        page,
        perPage: 25,
      })
      setMedicines(result.data)
      setTotal(result.meta.total)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [searchQ, activeFilter])
  useEffect(() => {
    void load()
  }, [page, searchQ, activeFilter])

  const openCreate = () => {
    setEditMed(null)
    setForm(emptyForm)
    setFormError("")
    setShowForm(true)
  }
  const openEdit = (m: Medicine) => {
    setEditMed(m)
    setForm({
      genericName: m.genericName,
      brandName: m.brandName,
      description: m.description,
      dosageForm: m.dosageForm,
      strength: m.strength,
      unitPrice: m.unitPrice,
      storageLocation: m.storageLocation,
    })
    setFormError("")
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!form.genericName.trim()) {
      setFormError("Generic name is required.")
      return
    }
    if (
      !form.unitPrice ||
      isNaN(parseFloat(form.unitPrice)) ||
      parseFloat(form.unitPrice) < 0
    ) {
      setFormError("Valid unit price is required.")
      return
    }
    setFormLoading(true)
    try {
      if (editMed) {
        await mockApi.updateMedicine(editMed.id, form)
        showToast("Medicine updated successfully.")
      } else {
        await mockApi.createMedicine(form)
        showToast("Medicine created successfully.")
      }
      setShowForm(false)
      await load()
    } catch (e) {
      if (e instanceof MockApiError) setFormError(e.apiError.message)
      else setFormError("Save failed.")
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddStock = async () => {
    setStockError("")
    if (!stockMed) return
    if (stockForm.quantity <= 0) {
      setStockError("Quantity must be positive.")
      return
    }
    if (!stockForm.expiresAt) {
      setStockError("Expiry date is required.")
      return
    }
    setStockLoading(true)
    try {
      await mockApi.receiveStock({
        receivedAt: new Date().toISOString(),
        items: [
          {
            medicineId: stockMed.id,
            quantity: stockForm.quantity,
            expiresAt: stockForm.expiresAt,
          },
        ],
        idempotencyKey: `stock_${stockMed.id}_${Date.now()}`,
      })
      showToast(`Stock received for ${stockMed.genericName}.`)
      setStockMed(null)
      await load()
    } catch (e) {
      if (e instanceof MockApiError) setStockError(e.apiError.message)
      else setStockError("Failed to receive stock.")
    } finally {
      setStockLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveMed) return
    setArchiveLoading(true)
    try {
      await mockApi.archiveMedicine(archiveMed.id)
      showToast(`${archiveMed.genericName} archived.`)
      setArchiveMed(null)
      await load()
    } catch {
      /* ignore */
    } finally {
      setArchiveLoading(false)
    }
  }

  const field = (
    k: keyof MedForm,
    label: string,
    type?: string,
    hint?: string,
  ) => (
    <Input
      label={label}
      type={type ?? "text"}
      value={form[k]}
      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
      hint={hint}
    />
  )

  return (
    <div>
      <PageHeader
        title="Medicine Catalog"
        subtitle={`${total} medicines`}
        action={<Button onClick={openCreate}>+ Add Medicine</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search by name, brand, ID, location..."
            className="w-64"
          />
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["active", "archived", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs font-medium px-3 py-1 rounded-md transition-colors capitalize ${
                  activeFilter === f
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
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
                  <Th>Item Code</Th>
                  <Th>Generic Name</Th>
                  <Th>Brand</Th>
                  <Th>Dosage Form</Th>
                  <Th>Strength</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Unit Price</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <EmptyState
                        title="No medicines found"
                        description="Try adjusting your search or filter."
                        action={
                          <Button onClick={openCreate} size="sm">
                            Add Medicine
                          </Button>
                        }
                      />
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
                    <Td className="text-slate-600">{m.brandName}</Td>
                    <Td className="text-slate-500 text-xs">{m.dosageForm}</Td>
                    <Td className="text-slate-500 text-xs font-mono">
                      {m.strength}
                    </Td>
                    <Td className="text-right">
                      <span
                        className={`font-mono font-medium text-sm ${
                          m.stockOnHand < 30
                            ? "text-amber-600"
                            : "text-slate-700"
                        }`}
                      >
                        {m.stockOnHand}
                        {m.stockOnHand < 30 && m.active && (
                          <span className="ml-1 text-xs" title="Low stock">
                            ⚠
                          </span>
                        )}
                      </span>
                    </Td>
                    <Td className="text-right font-mono text-sm">
                      {formatPHP(m.unitPrice)}
                    </Td>
                    <Td className="text-xs text-slate-400">
                      {m.storageLocation}
                    </Td>
                    <Td>
                      {m.active ? (
                        <Badge variant="green">Active</Badge>
                      ) : (
                        <Badge variant="gray">Archived</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-xs text-teal-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        {m.active && (
                          <>
                            <span className="text-slate-200">·</span>
                            <button
                              onClick={() => {
                                setStockMed(m)
                                setStockForm({ quantity: 1, expiresAt: "" })
                                setStockError("")
                              }}
                              className="text-xs text-navy-600 hover:underline font-medium"
                            >
                              Add Stock
                            </button>
                            <span className="text-slate-200">·</span>
                            <button
                              onClick={() => setArchiveMed(m)}
                              className="text-xs text-red-500 hover:underline font-medium"
                            >
                              Archive
                            </button>
                          </>
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

      {/* Create / Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editMed ? `Edit: ${editMed.genericName}` : "Add New Medicine"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={formLoading}>
              {editMed ? "Save Changes" : "Create Medicine"}
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-4">
            <ErrorBanner
              message={formError}
              onDismiss={() => setFormError("")}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {field("genericName", "Generic Name")}
          {field("brandName", "Brand Name")}
          {field("description", "Description (suspension / form details)")}
          {field(
            "dosageForm",
            "Dosage Form (e.g. Tablet, Capsule, Suspension)",
          )}
          {field("strength", "Strength / Dosage (e.g. 500mg, 10mg/5mL)")}
          {field("unitPrice", "Unit Price (₱)", "number", "PHP, e.g. 12.50")}
          {field("storageLocation", "Storage Location (e.g. Shelf A-1)")}
        </div>
      </Modal>

      {/* Add stock modal */}
      <Modal
        open={!!stockMed}
        onClose={() => setStockMed(null)}
        title={`Add Stock: ${stockMed?.genericName}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setStockMed(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddStock} loading={stockLoading}>
              Receive Stock
            </Button>
          </>
        }
      >
        {stockError && (
          <div className="mb-4">
            <ErrorBanner
              message={stockError}
              onDismiss={() => setStockError("")}
            />
          </div>
        )}
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the quantity being received and the lot expiry date. This
            amount will be added to the current stock; it does not replace the
            total.
          </p>
          <Input
            label="Quantity to Add"
            type="number"
            min={1}
            value={stockForm.quantity}
            onChange={(e) =>
              setStockForm((f) => ({
                ...f,
                quantity: parseInt(e.target.value) || 0,
              }))
            }
          />
          <Input
            label="Lot Expiry Date"
            type="date"
            value={stockForm.expiresAt}
            onChange={(e) =>
              setStockForm((f) => ({ ...f, expiresAt: e.target.value }))
            }
          />
        </div>
      </Modal>

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveMed}
        onClose={() => setArchiveMed(null)}
        onConfirm={handleArchive}
        title="Archive Medicine"
        message={`Archive ${archiveMed?.genericName} (${archiveMed?.brandName})? It will no longer be available for new sales but will remain in history.`}
        confirmLabel="Archive"
        loading={archiveLoading}
      />
    </div>
  )
}
