import { type TransportClient, TransportRequestError } from "@/shared/api"
import { readPageMeta, unwrapData, withQuery } from "@/shared/api/query"

import type { Page } from "@/entities/shared/model/page"

import type {
  PaymentStatus,
  Sale,
  SaleCancellation,
  SaleCreatePayload,
  SaleItem,
  SaleItemInput,
  SaleListParams,
  SaleState,
} from "../model/types"

export function createSaleApi(client: Pick<TransportClient, "request">) {
  return {
    async list(params: SaleListParams = {}): Promise<Page<Sale>> {
      const response = await client.request<unknown>(
        withQuery("/sales", params),
        { method: "GET" },
      )

      return readSalePage(response.data)
    },

    async create(payload: SaleCreatePayload, idempotencyKey: string) {
      return requestSale(client, "/sales", {
        method: "POST",
        body: payload,
        headers: { "Idempotency-Key": idempotencyKey },
      })
    },

    async addItem(
      saleId: number,
      payload: SaleItemInput,
      idempotencyKey: string,
    ) {
      return requestSale(client, `/sales/${saleId}/items`, {
        method: "POST",
        body: payload,
        headers: { "Idempotency-Key": idempotencyKey },
      })
    },

    async removeItem(saleId: number, saleItemId: number) {
      return requestSale(client, `/sales/${saleId}/items/${saleItemId}`, {
        method: "DELETE",
      })
    },

    async show(id: number) {
      return requestSale(client, `/sales/${id}`, { method: "GET" })
    },

    async markPaid(id: number) {
      return requestSale(client, `/sales/${id}/mark-paid`, { method: "POST" })
    },

    async cancel(id: number, reason: string) {
      return requestSale(client, `/sales/${id}/cancel`, {
        method: "POST",
        body: { reason },
      })
    },
  }
}

async function requestSale(
  client: Pick<TransportClient, "request">,
  path: string,
  init: {
    method: string
    body?: unknown
    headers?: Record<string, string>
  },
): Promise<Sale> {
  const response = await client.request<unknown>(path, init)

  return readSale(unwrapData(response.data))
}

function readSalePage(value: unknown): Page<Sale> {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    throw invalidResponse("sale list")
  }

  return {
    data: value.data.map(readSale),
    meta: readPageMeta(value, value.data.length),
  }
}

function readSale(value: unknown): Sale {
  if (!isRecord(value)) {
    throw invalidResponse("sale")
  }

  const items = value.items
  const cancellation = value.cancellation

  return {
    id: readNumber(value.id, "id"),
    state: readSaleState(value.state),
    paymentStatus: readPaymentStatus(value.paymentStatus),
    items: items === undefined ? undefined : readSaleItems(items),
    grandTotal: readString(value.total, "total"),
    itemCount: readOptionalNumber(value.itemCount, "itemCount"),
    createdBy: readNumber(value.createdBy, "createdBy"),
    createdByName: readOptionalString(value.createdByName, "createdByName"),
    createdAt: readString(value.createdAt, "createdAt"),
    completedAt: readOptionalString(value.completedAt, "completedAt"),
    cancelledAt: readOptionalString(value.cancelledAt, "cancelledAt"),
    cancellationReason: readOptionalString(
      value.cancellationReason,
      "cancellationReason",
    ),
    cancellation:
      cancellation === undefined || cancellation === null
        ? cancellation
        : readCancellation(cancellation),
  }
}

function readSaleItems(value: unknown): SaleItem[] {
  if (!Array.isArray(value)) {
    throw invalidResponse("sale items")
  }

  return value.map(readSaleItem)
}

function readSaleItem(value: unknown): SaleItem {
  if (!isRecord(value)) {
    throw invalidResponse("sale item")
  }

  return {
    id: readNumber(value.id, "item.id"),
    medicineId: readNumber(value.medicineId, "item.medicineId"),
    quantity: readNumber(value.quantity, "item.quantity"),
    unitPrice: readString(value.unitPrice, "item.unitPrice"),
    lineTotal: readString(value.lineTotal, "item.lineTotal"),
    state: readSaleItemState(value.state),
    genericName: readOptionalString(value.genericName, "item.genericName"),
    brandName: readOptionalNullableString(value.brandName, "item.brandName"),
    dosageForm: readOptionalString(value.dosageForm, "item.dosageForm"),
    strength: readOptionalNullableString(value.strength, "item.strength"),
  }
}

function readCancellation(value: unknown): SaleCancellation {
  if (!isRecord(value)) {
    throw invalidResponse("sale cancellation")
  }

  return {
    cancelledBy: readNumber(value.cancelledBy, "cancelledBy"),
    reason: readString(value.reason, "reason"),
    cancelledAt: readString(value.cancelledAt, "cancelledAt"),
  }
}

function readSaleState(value: unknown): SaleState {
  if (value === "open" || value === "completed" || value === "cancelled") {
    return value
  }

  throw invalidResponse("sale state")
}

function readPaymentStatus(value: unknown): PaymentStatus {
  if (value === "unpaid" || value === "paid") {
    return value
  }

  throw invalidResponse("sale payment status")
}

function readSaleItemState(value: unknown): SaleItem["state"] {
  if (value === "active" || value === "removed" || value === "cancelled") {
    return value
  }

  throw invalidResponse("sale item state")
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`sale.${field}`)
  }

  return value
}

function readOptionalString(value: unknown, field: string): string | undefined {
  if (value !== undefined && typeof value !== "string") {
    throw invalidResponse(`sale.${field}`)
  }

  return value
}

function readOptionalNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value !== undefined && value !== null && typeof value !== "string") {
    throw invalidResponse(`sale.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`sale.${field}`)
  }

  return value
}

function readOptionalNumber(value: unknown, field: string): number | undefined {
  if (
    value !== undefined &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw invalidResponse(`sale.${field}`)
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
