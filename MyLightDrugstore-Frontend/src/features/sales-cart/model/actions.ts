export type SalesCartAction = {
  removeItem(saleId: number, saleItemId: number): Promise<unknown>

  markPaid(saleId: number): Promise<unknown>

  cancel(saleId: number, reason: string): Promise<unknown>
}
