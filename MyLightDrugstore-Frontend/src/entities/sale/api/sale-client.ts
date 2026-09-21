import type { TransportClient } from "@/shared/api"
import type { Sale, SaleCreatePayload, SaleListParams } from "../model/types"

export function createSaleApi(client: Pick<TransportClient, "request">) {
  return {
    list(params: SaleListParams = {}) {
      return client.request<Sale[]>(withQuery("/sales", params), {
        method: "GET",
      })
    },
    create(payload: SaleCreatePayload) {
      return client.request<Sale>("/sales", { method: "POST", body: payload })
    },
    show(id: string) {
      return client.request<Sale>(`/sales/${id}`, { method: "GET" })
    },
    markPaid(id: string) {
      return client.request<Sale>(`/sales/${id}/mark-paid`, { method: "POST" })
    },
    cancel(id: string, reason: string) {
      return client.request<Sale>(`/sales/${id}/cancel`, {
        method: "POST",
        body: { reason },
      })
    },
  }
}

function withQuery(path: string, params: SaleListParams): string {
  const query = new URLSearchParams()
  if (params.status) query.set("status", params.status)
  const encoded = query.toString()
  return encoded ? `${path}?${encoded}` : path
}
