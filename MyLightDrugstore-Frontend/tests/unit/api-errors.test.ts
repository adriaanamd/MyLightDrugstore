import assert from "node:assert/strict"
import { test } from "node:test"
import { ApiError, normalizeApiError } from "@/shared/api/errors"
import { getRequestId } from "@/shared/api/request-id"

test("API error normalization preserves status, code, details, and request ID", () => {
  const error = normalizeApiError({
    status: 422,
    headers: new Headers({ "X-Request-ID": "req-123" }),
    body: {
      error: {
        code: "validation_failed",
        message: "The medicine is invalid.",
        details: { name: ["The name field is required."] },
        requestId: "body-id",
      },
    },
  })

  assert.ok(error instanceof ApiError)
  assert.equal(error.status, 422)
  assert.equal(error.code, "validation_failed")
  assert.equal(error.message, "The medicine is invalid.")
  assert.equal(error.requestId, "req-123")
  assert.deepEqual(error.details, { name: ["The name field is required."] })
})

test("request ID normalization falls back to the encrypted error body", () => {
  assert.equal(
    getRequestId(new Headers(), { error: { requestId: "body-id" } }),
    "body-id",
  )
  assert.equal(getRequestId(new Headers(), {}), undefined)
})
