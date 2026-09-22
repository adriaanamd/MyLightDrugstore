import { getRequestId } from "./request-id"
import { TransportRequestError } from "./transport/errors"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function normalizeApiError(input: unknown): ApiError {
  if (input instanceof ApiError) {
    return input
  }

  if (input instanceof TransportRequestError) {
    return new ApiError(
      input.message,
      input.status,
      input.code,
      input.requestId,
      input.details,
    )
  }

  if (isHttpErrorInput(input)) {
    const payload = isApiErrorPayload(input.body) ? input.body.error : undefined
    return new ApiError(
      payload?.message ?? `The API request failed with status ${input.status}.`,
      input.status,
      payload?.code ?? "api_error",
      getRequestId(input.headers, input.body),
      payload?.details,
    )
  }

  return new ApiError("The API request failed.", 0, "unknown_error")
}

type ApiErrorPayload = {
  code?: string
  message?: string
  requestId?: string
  details?: unknown
}

type HttpErrorInput = {
  status: number
  headers: Headers
  body: unknown
}

function isHttpErrorInput(value: unknown): value is HttpErrorInput {
  return (
    isRecord(value) &&
    typeof value.status === "number" &&
    value.headers instanceof Headers &&
    "body" in value
  )
}

function isApiErrorPayload(
  value: unknown,
): value is { error: ApiErrorPayload } {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false
  }

  return value.error.code === undefined || typeof value.error.code === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
