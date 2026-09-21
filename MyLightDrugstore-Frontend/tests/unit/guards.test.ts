import assert from "node:assert/strict"
import { test } from "node:test"
import { requireAuthenticated } from "@/app/router/guards"

test("authenticated guard rejects an anonymous route context", () => {
  assert.throws(
    () =>
      requireAuthenticated({
        session: {
          getSnapshot: () => ({ status: "anonymous", user: null }),
          bootstrap: async () => undefined,
        },
      }),
    (error: unknown) => {
      if (!error || typeof error !== "object" || !("options" in error)) {
        return false
      }

      const options = error.options
      return (
        typeof options === "object" &&
        options !== null &&
        "href" in options &&
        options.href === "/login"
      )
    },
  )
})

test("authenticated guard returns the current user", () => {
  const user = { username: "staff", fullName: "Staff User" }
  assert.deepEqual(
    requireAuthenticated({
      session: {
        getSnapshot: () => ({ status: "authenticated", user }),
        bootstrap: async () => undefined,
      },
    }),
    user,
  )
})
