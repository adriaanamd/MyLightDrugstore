import type { TransportClient } from "@/shared/api"
import type { ReportFilters, ReportResult } from "../model/types"

export function createReportApi(client: Pick<TransportClient, "request">) {
  return {
    inventory(filters: ReportFilters = {}) {
      return client.request<ReportResult>(
        withQuery("/reports/inventory", filters),
        {
          method: "GET",
        },
      )
    },
    sales(filters: ReportFilters = {}) {
      return client.request<ReportResult>(
        withQuery("/reports/sales", filters),
        {
          method: "GET",
        },
      )
    },
  }
}

function withQuery(path: string, filters: ReportFilters): string {
  const query = new URLSearchParams()
  if (filters.from) query.set("from", filters.from)
  if (filters.to) query.set("to", filters.to)
  if (filters.status) query.set("status", filters.status)
  const encoded = query.toString()
  return encoded ? `${path}?${encoded}` : path
}
