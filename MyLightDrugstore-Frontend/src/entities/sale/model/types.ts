export type SaleItemInput = {
  medicineId: string
  quantity: number
}

export type SaleCreatePayload = {
  customerName?: string
  items: SaleItemInput[]
}

export type SaleListParams = {
  status?: string
}

export type Sale = {
  id: string
  status: string
  total?: number
  items?: SaleItemInput[]
}
