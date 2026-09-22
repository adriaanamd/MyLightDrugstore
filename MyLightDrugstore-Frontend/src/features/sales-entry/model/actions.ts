import type { SaleCreatePayload, SaleItemInput } from "@/entities/sale"

export type SalesEntryAction = {
  create(payload: SaleCreatePayload): Promise<unknown>

  resetCreate(): void

  addItem(saleId: number, payload: SaleItemInput): Promise<unknown>

  resetAddItem(): void
}
