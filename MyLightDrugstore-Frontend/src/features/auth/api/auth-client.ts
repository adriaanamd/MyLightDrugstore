import type { TransportClient, TransportResponse } from "@/shared/api"

export type AuthUserProfile = {
  id?: number
  username: string
  fullName: string
  role?: "admin" | "staff" | string
  active?: boolean
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
  return {
    csrf() {
      return client.request<{ csrfToken: string }>("/auth/csrf", {
        method: "GET",
      })
    },
    async login(
      credentials: LoginCredentials,
    ): Promise<TransportResponse<AuthUserProfile>> {
      await client.request("/auth/csrf", { method: "GET" })
      return client.request<AuthUserProfile>("/auth/login", {
        method: "POST",
        body: credentials,
      })
    },
    me() {
      return client.request<AuthUserProfile>("/auth/me", { method: "GET" })
    },
    logout() {
      return client.request<undefined>("/auth/logout", { method: "POST" })
    },
    changePassword(payload: ChangePasswordPayload) {
      return client.request<undefined>("/auth/change-password", {
        method: "POST",
        body: payload,
      })
    },
  }
}
