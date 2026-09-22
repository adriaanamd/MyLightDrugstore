import type { PageMeta } from "@/entities/shared/model/page"

export type ReportFilters = {
  from?: string

  to?: string

  status?: string

  lowStock?: boolean

  expiresBefore?: string

  page?: number

  perPage?: number
}

export type InventoryReportRow = {
  medicineId: number

  genericName: string

  brandName: string | null

  dosageForm: string

  strength: string | null

  unitPrice: string

  stockOnHand: number

  lowStock: boolean

  earliestExpiry: string | null
}

export type InventoryReportResponse = {
  data: InventoryReportRow[]

  meta: PageMeta
}

export type InventoryReport = {
  rows: InventoryReportRow[]

  total: number
}

export type SalesReport = {
  from: string | null

  to: string | null

  saleCount: number

  grossSales: string

  paidSaleCount: number

  paidGrossSales: string

  cancelledSaleCount: number
}

export type SalesReportResponse = {
  data: SalesReport
}

export type ReportResult = InventoryReportResponse | SalesReportResponse
