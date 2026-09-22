import { describe, expect, it } from "vitest"

import { createAuthClient } from "../../src/features/auth/api/auth-client"
import type { TransportResponse } from "../../src/shared/api"

type RequestCall = {
  path: string

  init?: RequestInit & { body?: unknown }
}

function createTestClient(responses: unknown[]) {
  const calls: RequestCall[] = []

  const request = async <T,>(
    path: string,
    init?: RequestCall["init"],
  ): Promise<TransportResponse<T>> => {
    calls.push({ path, init })

    return {
      data: responses.shift() as T,
      status: 200,
      headers: new Headers(),
    }
  }

  return { calls, client: { request } }
}

const profile = {
  id: 7,
  username: "ada",
  fullName: "Ada Staff",
  role: "staff",
  active: true,
}

describe("auth client", () => {
  it("sequences csrf before login and maps the profile", async () => {
    const { calls, client } = createTestClient([
      { data: { csrfToken: "csrf-token" } },
      { data: profile },
    ])
    const api = createAuthClient(client)

    await expect(
      api.login({ username: "ada", password: "a-secure-password" }),
    ).resolves.toEqual(profile)

    expect(calls).toMatchObject([
      { path: "/auth/csrf", init: { method: "GET" } },
      {
        path: "/auth/login",
        init: {
          method: "POST",
          body: { username: "ada", password: "a-secure-password" },
        },
      },
    ])
  })

  it("maps current user and clears session on logout", async () => {
    const { calls, client } = createTestClient([
      { data: profile },
      undefined,
      undefined,
    ])
    const api = createAuthClient(client)

    await expect(api.me()).resolves.toEqual(profile)
    await expect(api.logout()).resolves.toBeUndefined()
    await expect(
      api.changePassword({
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    ).resolves.toBeUndefined()

    expect(calls).toMatchObject([
      { path: "/auth/me", init: { method: "GET" } },
      { path: "/auth/logout", init: { method: "POST" } },
      {
        path: "/auth/change-password",
        init: {
          method: "POST",
          body: {
            currentPassword: "old-password",
            newPassword: "new-password",
          },
        },
      },
    ])
  })
})
