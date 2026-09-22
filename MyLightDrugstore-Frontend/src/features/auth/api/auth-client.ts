import type { TransportClient } from "@/shared/api"
import { TransportRequestError } from "@/shared/api"
import { setCsrfToken } from "@/shared/api/transport/csrf"
import { unwrapData } from "@/shared/api/query"

import type { UserRole } from "@/entities/user/model/types"

export type AuthUserProfile = {
  id: number

  username: string

  fullName: string

  role: UserRole

  active: boolean
}

export type LoginCredentials = {
  username: string

  password: string
}

export type ChangePasswordPayload = {
  currentPassword: string

  newPassword: string
}

export function createAuthClient(client: Pick<TransportClient, "request">) {
  const csrf = async (): Promise<string> => {
    const response = await client.request<unknown>("/auth/csrf", {
      method: "GET",
    })
    const value = unwrapData(response.data)

    if (!isRecord(value) || typeof value.csrfToken !== "string") {
      throw invalidResponse("CSRF token")
    }

    const token = value.csrfToken.trim()

    if (!token) {
      throw invalidResponse("CSRF token")
    }

    setCsrfToken(token)
    return token
  }

  const readProfile = async (): Promise<AuthUserProfile> => {
    const response = await client.request<unknown>("/auth/me", {
      method: "GET",
    })

    return parseProfile(unwrapData(response.data))
  }

  return {
    csrf,

    async login(credentials: LoginCredentials): Promise<AuthUserProfile> {
      await csrf()
      const response = await client.request<unknown>("/auth/login", {
        method: "POST",
        body: credentials,
      })

      return parseProfile(unwrapData(response.data))
    },

    me: readProfile,

    async logout(): Promise<void> {
      await client.request<undefined>("/auth/logout", { method: "POST" })
    },

    async changePassword(payload: ChangePasswordPayload): Promise<void> {
      await client.request<undefined>("/auth/change-password", {
        method: "POST",
        body: payload,
      })
    },
  }
}

function parseProfile(value: unknown): AuthUserProfile {
  if (!isRecord(value)) {
    throw invalidResponse("authenticated user")
  }

  return {
    id: readNumber(value.id, "id"),
    username: readString(value.username, "username"),
    fullName: readString(value.fullName, "fullName"),
    role: readRole(value.role),
    active: readBoolean(value.active, "active"),
  }
}

function readRole(value: unknown): UserRole {
  if (value === "admin" || value === "staff") {
    return value
  }

  throw invalidResponse("authenticated user role")
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidResponse(`authenticated user.${field}`)
  }

  return value
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidResponse(`authenticated user.${field}`)
  }

  return value
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidResponse(`authenticated user.${field}`)
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
