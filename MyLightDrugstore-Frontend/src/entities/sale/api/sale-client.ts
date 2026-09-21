import type { TransportClient } from "@/shared/api"
import type {
  Sale,
  SaleCreatePayload,
  SaleItemInput,
  SaleListParams,
} from "../model/types"

export function createSaleApi(client: Pick<TransportClient, "request">) {
  return {
    list(params: SaleListParams = {}) {
      return client.request<Sale[]>(withQuery("/sales", params), {
        method: "GET",
      })
    },
    create(payload: SaleCreatePayload, idempotencyKey?: string) {
      return client.request<Sale>("/sales", {
        method: "POST",
        body: payload,
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      })
    },
    addItem(saleId: string, payload: SaleItemInput, idempotencyKey: string) {
      return client.request<Sale>(`/sales/${saleId}/items`, {
        method: "POST",
        body: payload,
        headers: { "Idempotency-Key": idempotencyKey },
      })
    },
    removeItem(saleId: string, saleItemId: string) {
      return client.request<Sale>(`/sales/${saleId}/items/${saleItemId}`, {
        method: "DELETE",
      })
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
