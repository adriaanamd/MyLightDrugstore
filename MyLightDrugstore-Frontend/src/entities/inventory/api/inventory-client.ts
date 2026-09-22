import type { TransportClient } from "@/shared/api"

import type {
  InventoryAdjustmentPayload,
  InventoryItem,
  InventoryListParams,
  InventoryReceiptPayload,
} from "../model/types"

export function createInventoryApi(client: Pick<TransportClient, "request">) {
  return {
    list(params: InventoryListParams = {}) {
      return client.request<InventoryItem[]>(withQuery("/inventory", params), {
        method: "GET",
      })
    },

    receive(payload: InventoryReceiptPayload) {
      return client.request<InventoryItem>("/inventory/receipts", {
        method: "POST",

        body: payload,
      })
    },

    adjust(payload: InventoryAdjustmentPayload) {
      return client.request<InventoryItem>("/inventory/adjustments", {
        method: "POST",

        body: payload,
      })
    },

    movements(params: InventoryListParams = {}) {
      return client.request<InventoryItem[]>(
        withQuery("/inventory/movements", params),

        { method: "GET" },
      )
    },
  }
}

function withQuery(path: string, params: InventoryListParams): string {
  const query = new URLSearchParams()

  if (params.medicineId) query.set("medicineId", String(params.medicineId))

  const encoded = query.toString()

  return encoded ? `${path}?${encoded}` : path
}
