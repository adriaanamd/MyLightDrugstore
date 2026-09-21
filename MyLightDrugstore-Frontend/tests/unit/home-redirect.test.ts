import assert from "node:assert/strict"
import { test } from "node:test"
import { redirectHome } from "@/app/router/guards"

test("anonymous users are sent from the placeholder home route to login", () => {
  assert.throws(
    () =>
      redirectHome({
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
        "to" in options &&
        options.to === "/login"
      )
    },
  )
})

test("authenticated users are sent from the placeholder home route to dashboard", () => {
  assert.throws(
    () =>
      redirectHome({
        session: {
          getSnapshot: () => ({
            status: "authenticated",
            user: { username: "admin", fullName: "Admin User" },
          }),
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
        "to" in options &&
        options.to === "/dashboard"
      )
    },
  )
})
