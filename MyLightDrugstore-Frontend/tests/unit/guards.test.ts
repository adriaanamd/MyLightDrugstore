import assert from "node:assert/strict"
import { test } from "node:test"
import { requireAuthenticated } from "@/app/router/guards"

test("authenticated guard rejects an anonymous route context", () => {
  assert.throws(
    () => requireAuthenticated({ user: null }),
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
  const user = { id: 7, name: "Staff" }
  assert.deepEqual(requireAuthenticated({ user }), user)
})
