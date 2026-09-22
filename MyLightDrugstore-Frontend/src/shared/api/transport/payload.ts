import { encodeBase64Url } from "./base64url"
import type { TransportRequestPayload, TransportResponsePayload } from "./types"

const MAX_TRANSPORT_REQUEST_BYTES = 1_400_000

export function serializeJsonPayload(value: unknown): Uint8Array {
  const valueJson = JSON.stringify(value)

  if (valueJson === undefined) {
    throw new Error("The transport request body is not serializable.")
  }

  const descriptor = JSON.stringify({
    kind: "json",
    contentType: "application/json",
    value: valueJson,
  })
  const bytes = new TextEncoder().encode(descriptor)

  if (bytes.byteLength > MAX_TRANSPORT_REQUEST_BYTES) {
    throw new Error("The transport request body is too large.")
  }

  return bytes
}

export function serializeBinaryPayload(
  bytes: Uint8Array,
  contentType: string,
): TransportRequestPayload {
  if (bytes.byteLength > MAX_TRANSPORT_REQUEST_BYTES) {
    throw new Error("The transport request body is too large.")
  }

  return {
    kind: "bytes",
    contentType: contentType.trim() || "application/octet-stream",
    value: encodeBase64Url(bytes),
  }
}

export function parseLogicalResponsePayload(
  value: unknown,
): TransportResponsePayload {
  if (!isRecord(value)) {
    throw invalidResponseDescriptor()
  }

  if (
    typeof value.contentType !== "string" ||
    typeof value.body !== "string" ||
    (value.bodyEncoding !== "utf8" && value.bodyEncoding !== "base64") ||
    !isStringRecord(value.headers)
  ) {
    throw invalidResponseDescriptor()
  }

  return {
    contentType: value.contentType,
    headers: value.headers,
    body: value.body,
    bodyEncoding: value.bodyEncoding,
  }
}

export function decodeLogicalResponseBody(
  payload: TransportResponsePayload,
): unknown {
  if (payload.bodyEncoding === "base64") {
    return decodeStandardBase64(payload.body)
  }

  if (payload.contentType.toLowerCase().includes("json")) {
    try {
      return JSON.parse(payload.body) as unknown
    } catch {
      return payload.body
    }
  }

  return payload.body
}

function decodeStandardBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([name, headerValue]) =>
        name.trim().length > 0 && typeof headerValue === "string",
    )
  )
}

function invalidResponseDescriptor(): Error {
  return new Error("The transport response descriptor is invalid.")
}
