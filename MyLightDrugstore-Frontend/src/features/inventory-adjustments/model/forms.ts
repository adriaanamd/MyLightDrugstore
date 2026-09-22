import type {
  AdjustmentReason,
  InventoryAdjustmentItem,
  InventoryAdjustmentPayload,
} from "@/entities/inventory"

export type AdjustmentFormValues = InventoryAdjustmentPayload

export type AdjustmentFormValidation = {
  valid: boolean

  message?: string
}

export function validateAdjustmentForm(
  values: AdjustmentFormValues,
): AdjustmentFormValidation {
  if (!isAdjustmentReason(values.reason)) {
    return { valid: false, message: "A valid adjustment reason is required." }
  }

  if (values.items.length === 0) {
    return { valid: false, message: "At least one lot is required." }
  }

  if (values.items.some((item) => !isValidAdjustmentItem(item))) {
    return {
      valid: false,
      message: "Each adjustment item needs a lot and non-zero quantity delta.",
    }
  }

  return { valid: true }
}

export function normalizeAdjustmentForm(
  values: AdjustmentFormValues,
): InventoryAdjustmentPayload {
  return {
    reason: values.reason,
    items: values.items.map((item) => ({ ...item })),
  }
}

function isAdjustmentReason(value: string): value is AdjustmentReason {
  return (
    value === "stock_count" ||
    value === "damage" ||
    value === "expiry" ||
    value === "correction"
  )
}

function isValidAdjustmentItem(item: InventoryAdjustmentItem): boolean {
  return (
    Number.isInteger(item.lotId) &&
    item.lotId > 0 &&
    Number.isInteger(item.quantityDelta) &&
    item.quantityDelta !== 0
  )
}
