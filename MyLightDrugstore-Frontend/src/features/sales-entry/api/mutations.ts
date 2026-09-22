import {
  createSaleApi,
  type SaleCreatePayload,
  type SaleItemInput,
} from "@/entities/sale"
import { apiClient } from "@/shared/api/api-client"
import { createIdempotencyKey } from "@/shared/lib/idempotency-key"

export type SalesApi = ReturnType<typeof createSaleApi>

export type IdempotencyKeyFactory = () => string

const salesApi = createSaleApi(apiClient.transport)

export function createSalesEntryActions(
  api: SalesApi,
  keyFactory: IdempotencyKeyFactory = createIdempotencyKey,
) {
  let createKey: string | null = null
  let addItemKey: string | null = null

  return {
    create(payload: SaleCreatePayload) {
      createKey ??= keyFactory()
      return api.create(payload, createKey)
    },

    resetCreate() {
      createKey = null
    },

    addItem(saleId: number, payload: SaleItemInput) {
      addItemKey ??= keyFactory()
      return api.addItem(saleId, payload, addItemKey)
    },

    resetAddItem() {
      addItemKey = null
    },
  }
}

export function createDefaultSalesEntryActions() {
  return createSalesEntryActions(salesApi)
}
