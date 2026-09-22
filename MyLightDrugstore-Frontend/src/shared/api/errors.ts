import { getRequestId } from "./request-id"

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

export function normalizeApiError(input: {
  status: number

  headers: Headers

  body: unknown
}): ApiError {
  const payload = isApiErrorPayload(input.body) ? input.body.error : undefined

  return new ApiError(
    payload?.message ?? `The API request failed with status ${input.status}.`,

    input.status,

    payload?.code ?? "api_error",

    getRequestId(input.headers, input.body),

    payload?.details,
  )
}

function isApiErrorPayload(
  value: unknown,
): value is {
  error: {
    code?: string

    message?: string

    details?: unknown
  }
} {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false
  }

  return !!value.error && typeof value.error === "object"
}
