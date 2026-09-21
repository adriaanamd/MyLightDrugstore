export type InventoryItem = {
  medicineId: string
  quantity: number
  unitCost?: number
  lotNumber?: string
  expiresAt?: string
}

export type InventoryListParams = {
  medicineId?: string
}

export type InventoryReceiptPayload = {
  medicineId: string
  quantity: number
  unitCost: number
  lotNumber?: string
  expiresAt?: string
}

export type InventoryAdjustmentPayload = {
  medicineId: string
  quantity: number
  reason: string
}
