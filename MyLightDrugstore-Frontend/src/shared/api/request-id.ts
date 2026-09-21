export function getRequestId(
  headers: Headers,
  body: unknown,
): string | undefined {
  const headerValue = headers.get("x-request-id")
  if (headerValue) return headerValue

  if (!body || typeof body !== "object" || !("error" in body)) {
    return undefined
  }

  const error = body.error
  if (!error || typeof error !== "object" || !("requestId" in error)) {
    return undefined
  }

  return typeof error.requestId === "string" ? error.requestId : undefined
}
