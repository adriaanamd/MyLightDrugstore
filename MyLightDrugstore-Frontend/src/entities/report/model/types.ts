export type ReportFilters = {
  from?: string
  to?: string
  status?: string
}

export type InventoryReportRow = {
  medicineId: string
  genericName?: string
  brandName?: string
  dosageForm?: string
  strength?: string
  unitPrice?: number | string
  stockOnHand: number
  lowStock?: boolean
  earliestExpiry?: string | null
}

export type InventoryReportResponse = {
  data: InventoryReportRow[]
  meta?: InventoryReportMeta
}

export interface InventoryReportMeta {
  total?: number
  page?: number
  perPage?: number
}

export type InventoryReport = {
  rows: InventoryReportRow[]
  total: number
}

export type SalesReport = {
  from?: string | null
  to?: string | null
  saleCount: number
  grossSales: string
  paidSaleCount: number
  paidGrossSales: string
  cancelledSaleCount: number
}

export type SalesReportResponse = { data: SalesReport }

export type ReportResult = InventoryReportResponse | SalesReportResponse
