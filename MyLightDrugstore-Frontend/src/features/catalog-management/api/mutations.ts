import { useCallback, useEffect, useState } from "react"

import {
  createMedicineApi,
  type Medicine,
  type MedicineCreatePayload,
  type MedicineId,
  type MedicineListParams,
  type MedicineUpdatePayload,
} from "@/entities/medicine"
import { apiClient } from "@/shared/api/api-client"
import { type ApiError, normalizeApiError } from "@/shared/api"

import { normalizeMedicineForm, type MedicineFormValues } from "../model/forms"

export type CatalogApi = ReturnType<typeof createMedicineApi>

const catalogApi = createMedicineApi(apiClient.transport)

export function createCatalogActions(api: CatalogApi) {
  return {
    create(values: MedicineFormValues): Promise<Medicine> {
      return api.create(normalizeMedicineForm(values))
    },

    update(id: MedicineId, values: MedicineFormValues): Promise<Medicine> {
      const payload: MedicineUpdatePayload = normalizeMedicineForm(values)
      return api.update(id, payload)
    },

    archive(id: MedicineId): Promise<Medicine> {
      return api.archive(id)
    },
  }
}

type ListState = {
  data: Medicine[]

  total: number

  loading: boolean

  error: ApiError | null
}

export function useMedicineList(params: MedicineListParams = {}) {
  const [state, setState] = useState<ListState>({
    data: [],
    total: 0,
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))

    try {
      const result = await catalogApi.list(params)
      setState({
        data: result.data,
        total: result.meta.total,
        loading: false,
        error: null,
      })
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        loading: false,
        error: normalizeApiError(error),
      }))
    }
  }, [
    params.q,
    params.search,
    params.active,
    params.lowStock,
    params.expiresBefore,
    params.page,
    params.perPage,
  ])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}

type MutationState<T,> = {
  loading: boolean

  result: T | null

  error: ApiError | null
}

type UpdateMedicineMutationPayload = {
  id: MedicineId

  payload: MedicineUpdatePayload
}

function useMutation<TPayload, TResult>(
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

export function useCreateMedicine() {
  return useMutation((payload: MedicineCreatePayload) =>
    catalogApi.create(payload),
  )
}

export function useUpdateMedicine() {
  return useMutation(({ id, payload }: UpdateMedicineMutationPayload) =>
    catalogApi.update(id, payload),
  )
}

export function useArchiveMedicine() {
  return useMutation((id: MedicineId) => catalogApi.archive(id))
}
