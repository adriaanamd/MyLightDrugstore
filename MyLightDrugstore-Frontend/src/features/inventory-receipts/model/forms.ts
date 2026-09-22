import type {
  InventoryReceiptItem,
  InventoryReceiptPayload,
} from "@/entities/inventory"

export type ReceiptFormValues = InventoryReceiptPayload

export type ReceiptFormValidation = {
  valid: boolean

  message?: string
}

export function validateReceiptForm(
  values: ReceiptFormValues,
): ReceiptFormValidation {
  if (!values.receivedAt || Number.isNaN(Date.parse(values.receivedAt))) {
    return { valid: false, message: "Receipt date is required." }
  }

  if (values.items.length === 0) {
    return { valid: false, message: "At least one medicine is required." }
  }

  const invalidItem = values.items.find((item) => !isValidReceiptItem(item))

  if (invalidItem !== undefined) {
    return {
      valid: false,
      message: "Each receipt item needs a medicine, quantity, and expiry date.",
    }
  }

  return { valid: true }
}

export function normalizeReceiptForm(
  values: ReceiptFormValues,
): InventoryReceiptPayload {
  return {
    receivedAt: values.receivedAt,
    items: values.items.map((item) => ({ ...item })),
  }
}

function isValidReceiptItem(item: InventoryReceiptItem): boolean {
  return (
    Number.isInteger(item.medicineId) &&
    item.medicineId > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.expiresAt)
  )
}
