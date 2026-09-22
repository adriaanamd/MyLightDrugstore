import type { MedicineId } from "@/entities/medicine/model/types"
import type { Page } from "@/entities/shared/model/page"

export type SaleState = "open" | "completed" | "cancelled"

export type PaymentStatus = "unpaid" | "paid"

export type SaleItemState = "active" | "removed" | "cancelled"

export type SaleItemInput = {
  medicineId: MedicineId

  quantity: number
}

export type SaleItem = SaleItemInput & {
  id: number

  unitPrice: string

  lineTotal: string

  state: SaleItemState

  genericName?: string

  brandName?: string | null

  dosageForm?: string

  strength?: string | null
}

export type SaleCancellation = {
  cancelledBy: number

  reason: string

  cancelledAt: string
}

export type Sale = {
  id: number

  state: SaleState

  paymentStatus: PaymentStatus

  items?: SaleItem[]

  grandTotal: string

  itemCount?: number

  createdBy: number

  createdByName?: string

  createdAt: string

  cancellation?: SaleCancellation | null
}

export type SaleCreatePayload = {
  items: SaleItemInput[]
}

export type SaleListParams = {
  paymentStatus?: PaymentStatus

  state?: SaleState

  status?: string

  from?: string

  to?: string

  createdBy?: number

  page?: number

  perPage?: number
}

export type SalePage = Page<Sale>
