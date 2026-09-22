import { type TransportClient, TransportRequestError } from "@/shared/api"
import { readPageMeta, unwrapData, withQuery } from "@/shared/api/query"

import type { Page } from "@/entities/shared/model/page"

import type {
  User,
  UserCreatePayload,
  UserListParams,
  UserUpdatePayload,
} from "../model/types"

export function createUserApi(client: Pick<TransportClient, "request">) {
  return {
    async list(params: UserListParams = {}): Promise<Page<User>> {
      const response = await client.request<unknown>(
        withQuery("/users", params),
        { method: "GET" },
      )

      if (!isRecord(response.data) || !Array.isArray(response.data.data)) {
        throw invalidResponse("user list")
      }

      return {
        data: response.data.data.map(readUser),
        meta: readPageMeta(response.data, response.data.data.length),
      }
    },

    async create(payload: UserCreatePayload): Promise<User> {
      const response = await client.request<unknown>("/users", {
        method: "POST",
        body: payload,
      })

      return readUser(unwrapData(response.data))
    },

    async show(id: number): Promise<User> {
      const response = await client.request<unknown>(`/users/${id}`, {
        method: "GET",
      })

      return readUser(unwrapData(response.data))
    },

    async update(id: number, payload: UserUpdatePayload): Promise<User> {
      const response = await client.request<unknown>(`/users/${id}`, {
        method: "PATCH",
        body: payload,
      })

      return readUser(unwrapData(response.data))
    },
  }
}

function readUser(value: unknown): User {
  if (!isRecord(value)) {
    throw invalidResponse("user")
  }

  return {
    id: readNumber(value.id, "id"),
    username: readString(value.username, "username"),
    fullName: readString(value.fullName, "fullName"),
    role: readRole(value.role),
    active: readBoolean(value.active, "active"),
    createdAt: readString(value.createdAt, "createdAt"),
    updatedAt: readNullableString(value.updatedAt, "updatedAt"),
  }
}

function readRole(value: unknown): User["role"] {
  if (value === "admin" || value === "staff") {
    return value
  }

  throw invalidResponse("user role")
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`user.${field}`)
  }

  return value
}

function readNullableString(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw invalidResponse(`user.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`user.${field}`)
  }

  return value
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponse(`user.${field}`)
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
