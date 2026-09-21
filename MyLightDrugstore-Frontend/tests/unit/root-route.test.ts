import assert from "node:assert/strict"
import { test } from "node:test"
import { Route } from "@/routes/__root"

test("root route owns the Start document shell", () => {
  assert.equal(Route.isRoot, true)
  assert.equal(typeof Route.options.component, "function")
  assert.equal(typeof Route.options.head, "function")
})
