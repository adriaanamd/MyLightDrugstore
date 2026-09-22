import { useCallback, useState } from "react"

import {
  createInventoryApi,
  type InventoryAdjustmentResult,
  type InventoryAdjustmentPayload,
  type InventoryReceiptPayload,
  type InventoryReceiptResult,
} from "@/entities/inventory"
import { apiClient } from "@/shared/api/api-client"
import { type ApiError, normalizeApiError } from "@/shared/api"

import {
  normalizeAdjustmentForm,
  type AdjustmentFormValues,
} from "../../inventory-adjustments/model/forms"
import {
  normalizeReceiptForm,
  type ReceiptFormValues,
} from "../../inventory-receipts/model/forms"

export type InventoryMutationApi = ReturnType<typeof createInventoryApi>

const inventoryApi = createInventoryApi(apiClient.transport)

export function createInventoryMutationActions(api: InventoryMutationApi) {
  return {
    async receive(
      values: ReceiptFormValues,
      refresh?: () => void | Promise<void>,
    ): Promise<InventoryReceiptResult> {
      const payload: InventoryReceiptPayload = normalizeReceiptForm(values)
      const result = await api.receive(payload)
      await refresh?.()
      return result
    },

    async adjust(
      values: AdjustmentFormValues,
      refresh?: () => void | Promise<void>,
    ): Promise<InventoryAdjustmentResult> {
      const payload: InventoryAdjustmentPayload =
        normalizeAdjustmentForm(values)
      const result = await api.adjust(payload)
      await refresh?.()
      return result
    },
  }
}

type MutationState<T,> = {
  loading: boolean

  result: T | null

  error: ApiError | null
}

function useInventoryMutation<TPayload, TResult>(
  operation: (payload: TPayload) => Promise<TResult>,
) {
  const [state, setState] = useState<MutationState<TResult>>({
    loading: false,
    result: null,
    error: null,
  })

  const execute = useCallback(
    async (payload: TPayload): Promise<TResult> => {
      setState({ loading: true, result: null, error: null })

      try {
        const result = await operation(payload)
        setState({ loading: false, result, error: null })
        return result
      } catch (error: unknown) {
        const apiError = normalizeApiError(error)
        setState({ loading: false, result: null, error: apiError })
        throw apiError
      }
    },
    [operation],
  )

  return { ...state, execute }
}

export function useReceiveStock() {
  return useInventoryMutation((payload: ReceiptFormValues) =>
    createInventoryMutationActions(inventoryApi).receive(payload),
  )
}

export function useAdjustInventory() {
  return useInventoryMutation((payload: AdjustmentFormValues) =>
    createInventoryMutationActions(inventoryApi).adjust(payload),
  )
}
