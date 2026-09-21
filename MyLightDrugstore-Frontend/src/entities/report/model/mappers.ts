import type {
  InventoryReport,
  InventoryReportResponse,
  SalesReport,
  SalesReportResponse,
} from "./types"

export function mapInventoryReportResponse(
  response: InventoryReportResponse,
): InventoryReport {
  return {
    rows: response.data,
    total: response.meta?.total ?? response.data.length,
  }
}

export function mapSalesReportResponse(
  response: SalesReportResponse,
): SalesReport {
  return response.data
}
