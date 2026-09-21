import assert from "node:assert/strict"
import { test } from "node:test"
import { createAuthClient } from "@/features/auth/api/auth-client"
import { createSessionStore } from "@/features/auth/model/session"

test("auth client bootstraps CSRF before login and keeps Laravel paths exact", async () => {
  const calls: unknown[] = []
  const auth = createAuthClient(fakeClient(calls))

  await auth.login({ username: "staff", password: "secret" })
  await auth.me()
  await auth.logout()

  assert.deepEqual(calls, [
    { path: "/auth/csrf", method: "GET" },
    {
      path: "/auth/login",
      method: "POST",
      body: { username: "staff", password: "secret" },
    },
    { path: "/auth/me", method: "GET" },
    { path: "/auth/logout", method: "POST" },
  ])
})

test("session store bootstraps from Laravel without browser storage", async () => {
  const user = { username: "staff", fullName: "Staff User" }
  const session = createSessionStore({
    async me() {
      return { data: user, status: 200, headers: new Headers() }
    },
    async login() {
      return { data: user, status: 200, headers: new Headers() }
    },
    async logout() {
      return { data: undefined, status: 204, headers: new Headers() }
    },
  })

  await session.bootstrap()
  assert.deepEqual(session.getSnapshot(), {
    status: "authenticated",
    user,
  })
})

test("session store treats an unauthenticated bootstrap as anonymous", async () => {
  const session = createSessionStore({
    async me() {
      throw new Error("Unauthenticated")
    },
    async login() {
      throw new Error("not used")
    },
    async logout() {
      return { data: undefined, status: 204, headers: new Headers() }
    },
  })

  await session.bootstrap()
  assert.deepEqual(session.getSnapshot(), { status: "anonymous", user: null })
})

function fakeClient(calls: unknown[]) {
  return {
    async request<T,>(
      path: string,
      init: {
        method?: string
        body?: unknown
      } = {},
    ) {
      calls.push({ path, ...init })
      return { data: {} as T, status: 200, headers: new Headers() }
    },
  }
}
