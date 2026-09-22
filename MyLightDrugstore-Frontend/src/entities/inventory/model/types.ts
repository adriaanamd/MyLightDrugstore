import type { MedicineId } from "@/entities/medicine/model/types"
import type { Page } from "@/entities/shared/model/page"

export type InventorySummary = {
  medicineId: MedicineId

  genericName: string

  brandName: string | null

  dosageForm: string

  strength: string | null

  unitPrice: string

  stockOnHand: number

  lowStock: boolean

  earliestExpiry: string | null
}

export type InventoryItem = InventorySummary

export type InventoryLot = {
  lotId: number

  medicineId: MedicineId

  genericName: string

  brandName: string | null

  receivedAt: string

  expiresAt: string

  quantityReceived: number

  quantityRemaining: number

  available: boolean
}

export type MovementType = "receipt" | "sale" | "sale_item_removal" | "sale_cancellation" | "adjustment"

export type InventoryMovement = {
  movementId: number

  medicineId: MedicineId

  genericName: string

  lotId: number

  actorUserId: number

  actorFullName: string

  movementType: MovementType

  quantityDelta: number

  reason: string | null

  sourceType: string | null

  sourceId: number | null

  occurredAt: string
}

export type InventorySummaryParams = {
  lowStock?: boolean

  expiresBefore?: string

  page?: number

  perPage?: number
}

export type InventoryLotParams = {
  medicineId?: MedicineId

  expiresBefore?: string

  available?: boolean

  page?: number

  perPage?: number
}

export type InventoryMovementParams = {
  medicineId?: MedicineId

  lotId?: number

  movementType?: MovementType

  from?: string

  to?: string

  page?: number

  perPage?: number
}

export type InventoryListParams = InventorySummaryParams & {
  medicineId?: MedicineId
}

export type InventoryReceiptItem = {
  medicineId: MedicineId

  quantity: number

  expiresAt: string
}

export type InventoryReceiptPayload = {
  receivedAt: string

  items: InventoryReceiptItem[]
}

export type InventoryReceiptResult = {
  receiptId: number

  receivedAt: string

  itemCount: number

  totalQuantity: number
}

export type AdjustmentReason = "stock_count" | "damage" | "expiry" | "correction"

export type InventoryAdjustmentItem = {
  lotId: number

  quantityDelta: number
}

export type InventoryAdjustmentPayload = {
  reason: AdjustmentReason

  items: InventoryAdjustmentItem[]
}

export type InventoryAdjustmentResult = {
  adjustmentId: number

  reason: AdjustmentReason

  itemCount: number

  totalQuantityDelta: number
}

export type InventorySummaryPage = Page<InventorySummary>

export type InventoryLotPage = Page<InventoryLot>

export type InventoryMovementPage = Page<InventoryMovement>
