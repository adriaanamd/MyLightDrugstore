import { type TransportClient, TransportRequestError } from "@/shared/api"
import { readPageMeta, unwrapData, withQuery } from "@/shared/api/query"

import type { Page } from "@/entities/shared/model/page"

import type {
  Medicine,
  MedicineCreatePayload,
  MedicineId,
  MedicineListParams,
  MedicineUpdatePayload,
} from "../model/types"

export type MedicineListResponse = Page<Medicine>

export function createMedicineApi(client: Pick<TransportClient, "request">) {
  return {
    async list(params: MedicineListParams = {}): Promise<MedicineListResponse> {
      const response = await client.request<unknown>(
        withQuery("/medicines", params),
        { method: "GET" },
      )

      return readMedicinePage(response.data)
    },

    async create(payload: MedicineCreatePayload): Promise<Medicine> {
      const response = await client.request<unknown>("/medicines", {
        method: "POST",
        body: payload,
      })

      return readMedicine(unwrapData(response.data))
    },

    async show(id: MedicineId): Promise<Medicine> {
      const response = await client.request<unknown>(`/medicines/${id}`, {
        method: "GET",
      })

      return readMedicine(unwrapData(response.data))
    },

    async update(
      id: MedicineId,
      payload: MedicineUpdatePayload,
    ): Promise<Medicine> {
      const response = await client.request<unknown>(`/medicines/${id}`, {
        method: "PATCH",
        body: payload,
      })

      return readMedicine(unwrapData(response.data))
    },

    async archive(id: MedicineId): Promise<Medicine> {
      const response = await client.request<unknown>(
        `/medicines/${id}/archive`,
        { method: "POST" },
      )

      return readMedicine(unwrapData(response.data))
    },
  }
}

function readMedicinePage(value: unknown): MedicineListResponse {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    throw invalidResponse("medicine list")
  }

  return {
    data: value.data.map(readMedicine),
    meta: readPageMeta(value, value.data.length),
  }
}

function readMedicine(value: unknown): Medicine {
  if (!isRecord(value)) {
    throw invalidResponse("medicine")
  }

  return {
    id: readNumber(value.id, "id"),
    genericName: readString(value.genericName, "genericName"),
    brandName: readNullableString(value.brandName, "brandName"),
    description: readNullableString(value.description, "description"),
    dosageForm: readString(value.dosageForm, "dosageForm"),
    strength: readNullableString(value.strength, "strength"),
    unitPrice: readString(value.unitPrice, "unitPrice"),
    storageLocation: readNullableString(
      value.storageLocation,
      "storageLocation",
    ),
    active: readBoolean(value.active, "active"),
    stockOnHand: readNumber(value.stockOnHand, "stockOnHand"),
    createdAt: readString(value.createdAt, "createdAt"),
    updatedAt: readNullableString(value.updatedAt, "updatedAt"),
  }
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`medicine.${field}`)
  }

  return value
}

function readNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw invalidResponse(`medicine.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`medicine.${field}`)
  }

  return value
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponse(`medicine.${field}`)
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
