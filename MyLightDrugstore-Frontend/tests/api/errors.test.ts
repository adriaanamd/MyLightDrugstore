import { describe, expect, it } from "vitest"

import { ApiError, normalizeApiError } from "../../src/shared/api/errors"
import { TransportRequestError } from "../../src/shared/api/transport/errors"

describe("shared API errors", () => {
  it("preserves an existing ApiError", () => {
    const error = new ApiError("Invalid", 422, "validation_failed", "req-1")

    expect(normalizeApiError(error)).toBe(error)
  })

  it("normalizes transport errors without losing diagnostics", () => {
    const error = new TransportRequestError(
      "Encrypted request failed.",
      400,
      "transport_error",
      "req-2",
      { safe: true },
    )

    expect(normalizeApiError(error)).toMatchObject({
      message: "Encrypted request failed.",
      status: 400,
      code: "transport_error",
      requestId: "req-2",
      details: { safe: true },
    })
  })

  it("normalizes unknown failures into a debuggable generic error", () => {
    expect(normalizeApiError(new Error("internal detail"))).toMatchObject({
      status: 0,
      code: "unknown_error",
      message: "The API request failed.",
    })
  })

  it("reads request IDs from response headers before body fields", () => {
    const response = normalizeApiError({
      status: 422,
      headers: new Headers({ "x-request-id": "header-id" }),
      body: { error: { code: "validation_failed", requestId: "body-id" } },
    })

    expect(response.requestId).toBe("header-id")
  })
})
