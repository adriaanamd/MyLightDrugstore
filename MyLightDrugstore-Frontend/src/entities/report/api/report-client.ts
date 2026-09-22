import { type TransportClient, TransportRequestError } from "@/shared/api"
import { readPageMeta, unwrapData, withQuery } from "@/shared/api/query"

import type {
  InventoryReport,
  InventoryReportRow,
  ReportFilters,
  SalesReport,
} from "../model/types"

export function createReportApi(client: Pick<TransportClient, "request">) {
  return {
    async inventory(filters: ReportFilters = {}): Promise<InventoryReport> {
      const response = await client.request<unknown>(
        withQuery("/reports/inventory", {
          lowStock: filters.lowStock,
          expiresBefore: filters.expiresBefore,
          page: filters.page,
          perPage: filters.perPage,
        }),
        { method: "GET" },
      )

      return readInventoryReport(response.data)
    },

    async sales(filters: ReportFilters = {}): Promise<SalesReport> {
      const response = await client.request<unknown>(
        withQuery("/reports/sales", {
          from: filters.from,
          to: filters.to,
        }),
        { method: "GET" },
      )

      return readSalesReport(unwrapData(response.data))
    },
  }
}

function readInventoryReport(value: unknown): InventoryReport {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    throw invalidResponse("inventory report")
  }

  return {
    rows: value.data.map(readInventoryReportRow),
    total: readPageMeta(value, value.data.length).total,
  }
}

function readInventoryReportRow(value: unknown): InventoryReportRow {
  if (!isRecord(value)) {
    throw invalidResponse("inventory report row")
  }

  return {
    medicineId: readNumber(value.medicineId, "medicineId"),
    genericName: readString(value.genericName, "genericName"),
    brandName: readNullableString(value.brandName, "brandName"),
    dosageForm: readString(value.dosageForm, "dosageForm"),
    strength: readNullableString(value.strength, "strength"),
    unitPrice: readString(value.unitPrice, "unitPrice"),
    stockOnHand: readNumber(value.stockOnHand, "stockOnHand"),
    lowStock: readBoolean(value.lowStock, "lowStock"),
    earliestExpiry: readNullableString(value.earliestExpiry, "earliestExpiry"),
  }
}

function readSalesReport(value: unknown): SalesReport {
  if (!isRecord(value)) {
    throw invalidResponse("sales report")
  }

  return {
    from: readNullableString(value.from, "from"),
    to: readNullableString(value.to, "to"),
    saleCount: readNumber(value.saleCount, "saleCount"),
    grossSales: readString(value.grossSales, "grossSales"),
    paidSaleCount: readNumber(value.paidSaleCount, "paidSaleCount"),
    paidGrossSales: readString(value.paidGrossSales, "paidGrossSales"),
    cancelledSaleCount: readNumber(
      value.cancelledSaleCount,
      "cancelledSaleCount",
    ),
  }
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`report.${field}`)
  }

  return value
}

function readNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw invalidResponse(`report.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`report.${field}`)
  }

  return value
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponse(`report.${field}`)
  }

  return value
}

function invalidResponse(resource: string): TransportRequestError {
  return new TransportRequestError(
    `The ${resource} response is invalid.`,
    0,
    "transport_error",
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
