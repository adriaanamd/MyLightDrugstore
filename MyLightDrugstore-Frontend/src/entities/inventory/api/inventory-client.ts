import { type TransportClient, TransportRequestError } from "@/shared/api"
import { readPageMeta, unwrapData, withQuery } from "@/shared/api/query"

import type { Page } from "@/entities/shared/model/page"

import type {
  AdjustmentReason,
  InventoryAdjustmentPayload,
  InventoryAdjustmentResult,
  InventoryListParams,
  InventoryLot,
  InventoryLotParams,
  InventoryMovement,
  InventoryMovementParams,
  InventoryReceiptPayload,
  InventoryReceiptResult,
  InventorySummary,
  InventorySummaryParams,
} from "../model/types"

export function createInventoryApi(client: Pick<TransportClient, "request">) {
  const summary = async (
    params: InventorySummaryParams = {},
  ): Promise<Page<InventorySummary>> => {
    return readPage(
      await client.request<unknown>(withQuery("/inventory", params), {
        method: "GET",
      }),
      readInventorySummary,
      "inventory summary",
    )
  }

  return {
    summary,
    async list(params: InventoryListParams = {}) {
      return summary(params)
    },

    async lots(params: InventoryLotParams = {}): Promise<Page<InventoryLot>> {
      return readPage(
        await client.request<unknown>(withQuery("/inventory/lots", params), {
          method: "GET",
        }),
        readInventoryLot,
        "inventory lots",
      )
    },

    async receive(
      payload: InventoryReceiptPayload,
    ): Promise<InventoryReceiptResult> {
      const response = await client.request<unknown>("/inventory/receipts", {
        method: "POST",
        body: payload,
      })

      return readReceiptResult(unwrapData(response.data))
    },

    async adjust(
      payload: InventoryAdjustmentPayload,
    ): Promise<InventoryAdjustmentResult> {
      const response = await client.request<unknown>("/inventory/adjustments", {
        method: "POST",
        body: payload,
      })

      return readAdjustmentResult(unwrapData(response.data))
    },

    async movements(
      params: InventoryMovementParams = {},
    ): Promise<Page<InventoryMovement>> {
      return readPage(
        await client.request<unknown>(
          withQuery("/inventory/movements", params),
          { method: "GET" },
        ),
        readInventoryMovement,
        "inventory movements",
      )
    },
  }
}

function readPage<T>(
  response: { data: unknown },
  readItem: (value: unknown) => T,
  resource: string,
): Page<T> {
  if (!isRecord(response.data) || !Array.isArray(response.data.data)) {
    throw invalidResponse(resource)
  }

  return {
    data: response.data.data.map(readItem),
    meta: readPageMeta(response.data, response.data.data.length),
  }
}

function readInventorySummary(value: unknown): InventorySummary {
  if (!isRecord(value)) {
    throw invalidResponse("inventory summary item")
  }

  return {
    medicineId: readNumber(value.medicineId, "medicineId"),
    genericName: readString(value.genericName, "genericName"),
    brandName: readNullableString(value.brandName, "brandName"),
    dosageForm: readString(value.dosageForm, "dosageForm"),
    strength: readNullableString(value.strength, "strength"),
    unitPrice: readString(value.unitPrice, "unitPrice"),
    stockOnHand: readNumber(value.stockOnHand, "stockOnHand"),
    lowStock: readBoolean(value.lowStock, "lowStock"),
    earliestExpiry: readNullableString(value.earliestExpiry, "earliestExpiry"),
  }
}

function readInventoryLot(value: unknown): InventoryLot {
  if (!isRecord(value)) {
    throw invalidResponse("inventory lot")
  }

  return {
    lotId: readNumber(value.lotId, "lotId"),
    medicineId: readNumber(value.medicineId, "medicineId"),
    genericName: readString(value.genericName, "genericName"),
    brandName: readNullableString(value.brandName, "brandName"),
    receivedAt: readString(value.receivedAt, "receivedAt"),
    expiresAt: readString(value.expiresAt, "expiresAt"),
    quantityReceived: readNumber(value.quantityReceived, "quantityReceived"),
    quantityRemaining: readNumber(value.quantityRemaining, "quantityRemaining"),
    available: readBoolean(value.available, "available"),
  }
}

function readInventoryMovement(value: unknown): InventoryMovement {
  if (!isRecord(value)) {
    throw invalidResponse("inventory movement")
  }

  return {
    movementId: readNumber(value.movementId, "movementId"),
    medicineId: readNumber(value.medicineId, "medicineId"),
    genericName: readString(value.genericName, "genericName"),
    lotId: readNumber(value.lotId, "lotId"),
    actorUserId: readNumber(value.actorUserId, "actorUserId"),
    actorFullName: readString(value.actorFullName, "actorFullName"),
    movementType: readMovementType(value.movementType),
    quantityDelta: readNumber(value.quantityDelta, "quantityDelta"),
    reason: readNullableString(value.reason, "reason"),
    sourceType: readNullableString(value.sourceType, "sourceType"),
    sourceId: readNullableNumber(value.sourceId, "sourceId"),
    occurredAt: readString(value.occurredAt, "occurredAt"),
  }
}

function readReceiptResult(value: unknown): InventoryReceiptResult {
  if (!isRecord(value)) {
    throw invalidResponse("inventory receipt")
  }

  return {
    receiptId: readNumber(value.receiptId, "receiptId"),
    receivedAt: readString(value.receivedAt, "receivedAt"),
    itemCount: readNumber(value.itemCount, "itemCount"),
    totalQuantity: readNumber(value.totalQuantity, "totalQuantity"),
  }
}

function readAdjustmentResult(value: unknown): InventoryAdjustmentResult {
  if (!isRecord(value)) {
    throw invalidResponse("inventory adjustment")
  }

  return {
    adjustmentId: readNumber(value.adjustmentId, "adjustmentId"),
    reason: readAdjustmentReason(value.reason),
    itemCount: readNumber(value.itemCount, "itemCount"),
    totalQuantityDelta: readNumber(
      value.totalQuantityDelta,
      "totalQuantityDelta",
    ),
  }
}

function readMovementType(value: unknown): InventoryMovement["movementType"] {
  if (
    value === "receipt" ||
    value === "sale" ||
    value === "sale_item_removal" ||
    value === "sale_cancellation" ||
    value === "adjustment"
  ) {
    return value
  }

  throw invalidResponse("inventory movement type")
}

function readAdjustmentReason(value: unknown): AdjustmentReason {
  if (
    value === "stock_count" ||
    value === "damage" ||
    value === "expiry" ||
    value === "correction"
  ) {
    return value
  }

  throw invalidResponse("inventory adjustment reason")
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`inventory.${field}`)
  }

  return value
}

function readNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw invalidResponse(`inventory.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`inventory.${field}`)
  }

  return value
}

function readNullableNumber(value: unknown, field: string): number | null {
  if (
    value !== null &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw invalidResponse(`inventory.${field}`)
  }

  return value
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponse(`inventory.${field}`)
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
