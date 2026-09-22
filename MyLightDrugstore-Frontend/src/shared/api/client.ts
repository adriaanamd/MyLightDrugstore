import { createTransportClient, type TransportRequestInit } from "./index"
import type {
  AdjustmentReason,
  BackupJob,
  Lot,
  Medicine,
  MedicineBase,
  Receipt,
  Role,
  Sale,
  SaleItem,
  Session,
  User,
} from "./types"
import { MockApiError } from "./types"

const transport = createTransportClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
})

type Query = Record<string, string | number | boolean | undefined>
type Paged<T,> = {
  data: T[]
  meta: {
    page: number
    perPage: number
    total: number
  }
}

function withQuery(path: string, params: Query = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

function unwrap<T>(body: any): T {
  return body?.data !== undefined && Object.keys(body).length === 1
    ? body.data as T
    : body as T
}

function paged<T>(body: any, map: (value: any) => T): Paged<T> {
  const data = Array.isArray(body?.data) ? body.data.map(map) : []
  return {
    data,
    meta: body?.meta ?? { page: 1, perPage: data.length, total: data.length },
  }
}

function apiError(error: any): never {
  if (error instanceof MockApiError) throw error
  throw new MockApiError(error?.status ?? 500, {
    code: error?.code ?? "api_error",
    message: error?.message ?? "The API request failed.",
    requestId: error?.requestId ?? "",
  })
}

function user(value: any): User {
  return {
    id: String(value.id),
    username: value.username,
    fullName: value.fullName,
    role: value.role,
    active: value.active ?? true,
    createdAt: value.createdAt ?? "",
  }
}

function medicine(value: any): Medicine {
  return {
    id: String(value.id),
    genericName: value.genericName ?? "",
    brandName: value.brandName ?? "",
    description: value.description ?? "",
    dosageForm: value.dosageForm ?? "",
    strength: value.strength ?? "",
    unitPrice: String(value.unitPrice ?? "0.00"),
    storageLocation: value.storageLocation ?? "",
    active: Boolean(value.active),
    createdAt: value.createdAt ?? "",
    stockOnHand: Number(value.stockOnHand ?? 0),
  }
}

function lot(value: any): any {
  return {
    id: String(value.id ?? value.lotId),
    medicineId: String(value.medicineId),
    quantity: Number(value.quantityRemaining ?? value.quantity ?? 0),
    initialQuantity: Number(
      value.quantityReceived ?? value.initialQuantity ?? 0,
    ),
    expiresAt: value.expiresAt,
    receiptId: "",
    createdAt: value.receivedAt ?? "",
    genericName: value.genericName ?? "",
    brandName: value.brandName ?? "",
    isExpired: value.expiresAt < new Date().toISOString().slice(0, 10),
  }
}

function saleItem(value: any): SaleItem {
  return {
    id: String(value.id),
    saleId: String(value.saleId ?? ""),
    medicineId: String(value.medicineId),
    genericName: value.genericName ?? "",
    brandName: value.brandName ?? "",
    dosageForm: value.dosageForm ?? "",
    strength: value.strength ?? "",
    quantity: Number(value.quantity ?? 0),
    unitPrice: String(value.unitPrice ?? "0.00"),
    lineTotal: String(value.lineTotal ?? "0.00"),
    removed: Boolean(value.removed),
    removedAt: value.removedAt,
  }
}

function sale(value: any): Sale {
  return {
    id: String(value.id),
    state: value.state,
    paymentStatus: value.paymentStatus,
    items: (value.items ?? []).map(saleItem),
    grandTotal: String(value.grandTotal ?? value.total ?? "0.00"),
    createdBy: String(value.createdBy ?? ""),
    createdByName: value.createdByName ?? "",
    createdAt: value.createdAt ?? "",
    completedAt: value.completedAt,
    cancelledAt: value.cancelledAt,
    cancellationReason: value.cancellationReason,
  }
}

export class RemoteApiClient {
  private session: Session | null = null

  private async request<T,>(
    path: string,
    init?: TransportRequestInit,
  ): Promise<T> {
    try {
      const response = await transport.request<any>(path, init)
      return response.data as T
    } catch (error) {
      return apiError(error)
    }
  }

  private async resource<T,>(
    path: string,
    init?: TransportRequestInit,
  ): Promise<T> {
    return unwrap<T>(await this.request<any>(path, init))
  }

  async login(username: string, password: string) {
    const profile = user(
      await this.resource<any>("/auth/login", {
        method: "POST",
        body: { username, password },
      }),
    )
    this.session = { userId: profile.id, user: profile }
    return profile
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" })
    this.session = null
  }
  async getMe() {
    const profile = user(await this.resource<any>("/auth/me"))
    this.session = { userId: profile.id, user: profile }
    return profile
  }
  getSession() {
    return this.session
  }
  async changePassword(currentPassword: string, newPassword: string) {
    await this.request("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    })
  }

  async listMedicines(params: Query = {}) {
    return paged(
      await this.request<any>(withQuery("/medicines", params)),
      medicine,
    )
  }
  async getMedicine(id: string) {
    return medicine(await this.resource<any>(`/medicines/${id}`))
  }
  async createMedicine(
    data: Omit<MedicineBase, "id" | "active" | "createdAt">,
  ) {
    return medicine(
      await this.resource<any>("/medicines", { method: "POST", body: data }),
    )
  }
  async updateMedicine(
    id: string,
    data: Partial<Omit<MedicineBase, "id" | "active" | "createdAt">>,
  ) {
    return medicine(
      await this.resource<any>(`/medicines/${id}`, {
        method: "PATCH",
        body: data,
      }),
    )
  }
  async archiveMedicine(id: string) {
    return medicine(
      await this.resource<any>(`/medicines/${id}/archive`, { method: "POST" }),
    )
  }

  async listLots(params: Query = {}) {
    return paged(
      await this.request<any>(withQuery("/inventory/lots", params)),
      lot,
    ).data
  }
  async getInventoryOverview() {
    const inventory = paged(
      await this.request<any>("/inventory?perPage=100"),
      (value) => value,
    ).data
    const lots = await this.listLots()
    const today = new Date().toISOString().slice(0, 10)
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    const soonDate = soon.toISOString().slice(0, 10)
    return {
      medicineCount: inventory.length,
      totalStockUnits: inventory.reduce(
        (total: number, item: any) => total + Number(item.stockOnHand ?? 0),
        0,
      ),
      lowStockCount: inventory.filter((item: any) => item.lowStock).length,
      expiringSoonCount: lots.filter(
        (item: any) =>
          item.quantity > 0 &&
          item.expiresAt >= today &&
          item.expiresAt <= soonDate,
      ).length,
      expiredLotsCount: lots.filter(
        (item: any) => item.quantity > 0 && item.expiresAt < today,
      ).length,
    }
  }
  async receiveStock(data: {
    receivedAt: string
    items: Array<{
      medicineId: string
      quantity: number
      expiresAt: string
    }>
    idempotencyKey?: string
  }) {
    return this.resource<Receipt>("/inventory/receipts", {
      method: "POST",
      body: data,
    })
  }
  async recordAdjustment(data: {
    reason: AdjustmentReason
    items: Array<{
      lotId: string
      quantityDelta: number
    }>
  }) {
    return this.resource("/inventory/adjustments", {
      method: "POST",
      body: data,
    })
  }
  async listMovements(params: Query = {}) {
    const body = await this.request<any>(
      withQuery("/inventory/movements", {
        ...params,
        movementType: params.type,
      }),
    )
    return paged(body, (value) => ({
      ...value,
      id: String(value.movementId),
      lotId: String(value.lotId ?? ""),
      actorId: String(value.actorUserId ?? ""),
      actorName: value.actorFullName,
      type: value.movementType,
      createdAt: value.occurredAt,
    }))
  }

  async listSales(params: Query = {}) {
    return paged(
      await this.request<any>(
        withQuery("/sales", { ...params, status: params.paymentStatus }),
      ),
      sale,
    )
  }
  async getSale(id: string) {
    return sale(await this.resource<any>(`/sales/${id}`))
  }
  async createSale(
    items: Array<{
      medicineId: string
      quantity: number
    }>,
    idempotencyKey?: string,
  ) {
    return sale(
      await this.resource<any>("/sales", {
        method: "POST",
        body: { items },
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    )
  }
  async addSaleItem(
    saleId: string,
    item: {
      medicineId: string
      quantity: number
    },
    idempotencyKey?: string,
  ) {
    return sale(
      await this.resource<any>(`/sales/${saleId}/items`, {
        method: "POST",
        body: item,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      }),
    )
  }
  async removeSaleItem(saleId: string, saleItemId: string) {
    return sale(
      await this.resource<any>(`/sales/${saleId}/items/${saleItemId}`, {
        method: "DELETE",
      }),
    )
  }
  async markSalePaid(saleId: string) {
    return sale(
      await this.resource<any>(`/sales/${saleId}/mark-paid`, {
        method: "POST",
      }),
    )
  }
  async cancelSale(saleId: string, reason: string) {
    return sale(
      await this.resource<any>(`/sales/${saleId}/cancel`, {
        method: "POST",
        body: { reason },
      }),
    )
  }

  async getInventoryReport(params: Query = {}) {
    const inventory = paged(
      await this.request<any>(withQuery("/reports/inventory", params)),
      medicine,
    )
    const lots = await this.listLots({
      expiresBefore: params.expiresBefore as string | undefined,
    })
    return {
      medicines: inventory.data,
      expiringLots: lots,
      threshold: 30,
    }
  }
  async getSalesReport(params: Query = {}) {
    const summary = await this.resource<any>(
      withQuery("/reports/sales", params),
    )
    const sales = await this.listSales({
      from: params.from,
      to: params.to,
      perPage: 100,
    })
    const medicineTotals = new Map<string, {
      medicineId: string
      genericName: string
      brandName: string
      unitsSold: number
      saleCount: number
      gross: number
    }>()

    for (const currentSale of sales.data) {
      for (const item of currentSale.items) {
        if (item.removed) continue
        const existing = medicineTotals.get(item.medicineId) ?? {
          medicineId: item.medicineId,
          genericName: item.genericName,
          brandName: item.brandName,
          unitsSold: 0,
          saleCount: 0,
          gross: 0,
        }
        existing.unitsSold += item.quantity
        existing.gross += Number(item.lineTotal)
        existing.saleCount += 1
        medicineTotals.set(item.medicineId, existing)
      }
    }

    return {
      saleCount: summary.saleCount ?? 0,
      totalGross: summary.grossSales ?? "0.00",
      byMedicine: Array.from(medicineTotals.values()),
      sales: sales.data,
    }
  }
  async listUsers() {
    return paged(await this.request<any>("/users?perPage=100"), user).data
  }
  async createUser(data: {
    username: string
    fullName: string
    password: string
    role: Role
  }) {
    return user(
      await this.resource<any>("/users", { method: "POST", body: data }),
    )
  }
  async updateUser(
    id: string,
    data: {
      fullName?: string
      role?: Role
      active?: boolean
    },
  ) {
    return user(
      await this.resource<any>(`/users/${id}`, { method: "PATCH", body: data }),
    )
  }
  async requestBackup() {
    const value = await this.resource<any>("/backups", { method: "POST" })
    return {
      id: String(value.id),
      state: value.status,
      requestedBy: "",
      requestedByName: "",
      createdAt: value.requestedAt,
      completedAt: value.completedAt,
      notes: "",
    } as BackupJob
  }
  async downloadBackup(id: string) {
    const response = await transport.request<Uint8Array>(
      `/backups/${id}/download`,
      { method: "GET" },
    )
    return response.data
  }
  async listBackups() {
    return []
  }
  async getSystemTime() {
    return { utc: (await this.resource<any>("/system/time")).now }
  }
  computeStock(lots: Lot[], medicineId: string) {
    return lots
      .filter((item) => item.medicineId === medicineId)
      .reduce((total, item) => total + item.quantity, 0)
  }
  async getDb(): Promise<never> {
    throw new MockApiError(501, {
      code: "unsupported",
      message:
        "Local database access is not available when connected to the API.",
      requestId: "",
    })
  }
}

export const mockApi = new RemoteApiClient()
