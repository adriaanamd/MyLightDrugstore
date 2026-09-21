import type { TransportClient } from "@/shared/api"
import type {
  Medicine,
  MedicineListParams,
  MedicineWritePayload,
} from "../model/types"

export function createMedicineApi(client: Pick<TransportClient, "request">) {
  return {
    list(params: MedicineListParams = {}) {
      return client.request<MedicineListResponse>(
        withQuery("/medicines", params),
        { method: "GET" },
      )
    },
    update(id: string, payload: MedicineWritePayload) {
      return client.request<Medicine>(`/medicines/${id}`, {
        method: "PATCH",
        body: payload,
      })
    },
    archive(id: string) {
      return client.request<Medicine>(`/medicines/${id}/archive`, {
        method: "POST",
      })
    },
  }
}

export type MedicineListResponse = {
  data?: Medicine[]
  meta?: Record<string, unknown>
}

function withQuery(path: string, params: MedicineListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.perPage !== undefined) query.set("perPage", String(params.perPage))
  const encoded = query.toString()
  return encoded ? `${path}?${encoded}` : path
}
