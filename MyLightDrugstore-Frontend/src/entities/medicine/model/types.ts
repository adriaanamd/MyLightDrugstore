export type Medicine = {
  id: string
  name: string
  sku?: string
  genericName?: string
  category?: string
  unitPrice?: number
  stockOnHand?: number
  isArchived?: boolean
}

export type MedicineListParams = {
  search?: string
  page?: number
  perPage?: number
}

export type MedicineWritePayload = {
  name: string
  sku?: string
  genericName?: string
  category?: string
  unitPrice?: number
}
