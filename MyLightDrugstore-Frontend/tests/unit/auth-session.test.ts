import assert from "node:assert/strict"
import { test } from "node:test"
import { createAuthClient } from "@/features/auth/api/auth-client"

test("auth client bootstraps CSRF before login and keeps Laravel paths exact", async () => {
  const calls: unknown[] = []
  const auth = createAuthClient(fakeClient(calls))

  await auth.login({ email: "staff@example.test", password: "secret" })
  await auth.me()
  await auth.logout()

  assert.deepEqual(calls, [
    { path: "/auth/csrf", method: "GET" },
    {
      path: "/auth/login",
      method: "POST",
      body: { email: "staff@example.test", password: "secret" },
    },
    { path: "/auth/me", method: "GET" },
    { path: "/auth/logout", method: "POST" },
  ])
})

function fakeClient(calls: unknown[]) {
  return {
    async request<T>(path: string, init: { method?: string; body?: unknown } = {}) {
      calls.push({ path, ...init })
      return { data: {} as T, status: 200, headers: new Headers() }
    },
  }
}
