import { type TransportClient, TransportRequestError } from "@/shared/api"
import { unwrapData } from "@/shared/api/query"

import type { BackupJob } from "../model/types"

export function createBackupApi(client: Pick<TransportClient, "request">) {
  return {
    async create(): Promise<BackupJob> {
      const response = await client.request<unknown>("/backups", {
        method: "POST",
      })

      return readBackupJob(unwrapData(response.data))
    },

    async show(id: number): Promise<BackupJob> {
      const response = await client.request<unknown>(`/backups/${id}`, {
        method: "GET",
      })

      return readBackupJob(unwrapData(response.data))
    },

    async download(id: number): Promise<Uint8Array> {
      const response = await client.request<unknown>(
        `/backups/${id}/download`,
        { method: "GET" },
      )

      if (!(response.data instanceof Uint8Array)) {
        throw invalidResponse("backup download")
      }

      return response.data
    },
  }
}

function readBackupJob(value: unknown): BackupJob {
  if (!isRecord(value)) {
    throw invalidResponse("backup job")
  }

  return {
    id: readNumber(value.id, "id"),
    status: readStatus(value.status),
    requestedAt: readString(value.requestedAt, "requestedAt"),
    completedAt: readNullableString(value.completedAt, "completedAt"),
    size: readNullableNumber(value.size, "size"),
  }
}

function readStatus(value: unknown): BackupJob["status"] {
  if (value === "queued" || value === "completed" || value === "failed") {
    return value
  }

  throw invalidResponse("backup status")
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`backup.${field}`)
  }

  return value
}

function readNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw invalidResponse(`backup.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`backup.${field}`)
  }

  return value
}

function readNullableNumber(value: unknown, field: string): number | null {
  if (
    value !== null &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw invalidResponse(`backup.${field}`)
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
