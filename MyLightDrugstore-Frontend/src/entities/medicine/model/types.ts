export type MedicineId = number

export type Medicine = {
  id: MedicineId

  genericName: string

  brandName: string | null

  description: string | null

  dosageForm: string

  strength: string | null

  unitPrice: string

  storageLocation: string | null

  active: boolean

  stockOnHand: number

  createdAt: string

  updatedAt: string | null
}

export type MedicineListParams = {
  q?: string

  search?: string

  active?: boolean

  lowStock?: boolean

  expiresBefore?: string

  page?: number

  perPage?: number
}

export type MedicineCreatePayload = {
  genericName: string

  brandName?: string | null

  description?: string | null

  dosageForm: string

  strength?: string | null

  unitPrice: string

  storageLocation?: string | null
}

export type MedicineUpdatePayload = Partial<MedicineCreatePayload>

export type MedicineWritePayload = MedicineUpdatePayload
