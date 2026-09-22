import { createSaleApi } from "@/entities/sale"
import { apiClient } from "@/shared/api/api-client"

export type SalesCartApi = ReturnType<typeof createSaleApi>

const salesApi = createSaleApi(apiClient.transport)

export function createSalesCartActions(api: SalesCartApi) {
  return {
    removeItem(saleId: number, saleItemId: number) {
      return api.removeItem(saleId, saleItemId)
    },

    markPaid(saleId: number) {
      return api.markPaid(saleId)
    },

    cancel(saleId: number, reason: string) {
      return api.cancel(saleId, reason)
    },
  }
}

export function createDefaultSalesCartActions() {
  return createSalesCartActions(salesApi)
}
