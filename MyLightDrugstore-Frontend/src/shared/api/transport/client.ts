import { ensureCsrfToken, isSafeMethod, clearCsrfToken } from "./csrf"
import { decryptAesGcm, encryptAesGcm } from "./crypto"
import {
  buildAdditionalData,
  decodeTransportEnvelope,
  encodeTransportEnvelope,
} from "./envelope"
import { TransportRequestError } from "./errors"
import {
  decodeLogicalResponseBody,
  parseLogicalResponsePayload,
  serializeBinaryPayload,
  serializeJsonPayload,
} from "./payload"
import { createTransportSession } from "./session"

export type TransportRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown
  skipCsrf?: boolean
}

export type TransportResponse<T,> = {
  data: T
  status: number
  headers: Headers
  contentType?: string
}

export type TransportClient = {
  request<T>(
    path: string,
    init?: TransportRequestInit,
  ): Promise<TransportResponse<T>>
  clear(): void
}

export type TransportClientOptions = {
  baseUrl: string
  fetchImpl?: typeof fetch
}

export function createTransportClient({
  baseUrl,
  fetchImpl = fetch,
}: TransportClientOptions): TransportClient {
  const session = createTransportSession({ baseUrl, fetchImpl })

  return {
    request,
    clear(): void {
      session.clear()
      clearCsrfToken()
    },
  }

  async function request<T>(
    path: string,
    init: TransportRequestInit = {},
  ): Promise<TransportResponse<T>> {
    const { skipCsrf = false, body: logicalBody, ...requestInit } = init
    const method = (requestInit.method ?? "GET").toUpperCase()
    const url = resolveUrl(baseUrl, path)
    const requestTarget = new URL(url, "https://transport.invalid").pathname
    const additionalData = new TextEncoder().encode(
      buildAdditionalData(method, requestTarget),
    )
    const transportSession = await session.get()
    const headers = new Headers(requestInit.headers)

    headers.set("Accept", "application/json")
    headers.set(
      "X-Transport-Key",
      `${transportSession.keyId}.${transportSession.wrappedKey}`,
    )

    if (!skipCsrf && !isSafeMethod(method)) {
      const token = await ensureCsrfToken(async () => {
        const csrfResponse = await request<{ data: { csrfToken: string } }>(
          "/auth/csrf",
          { method: "GET", skipCsrf: true },
        )
        return readCsrfToken(csrfResponse.data)
      })
      headers.set("X-CSRF-TOKEN", token)
    }

    const encryptedBody =
      logicalBody === undefined
        ? undefined
        : await encryptRequestBody(
            logicalBody,
            headers,
            transportSession.aesKey,
            additionalData,
            transportSession.keyId,
          )

    if (encryptedBody !== undefined) {
      headers.set("Content-Type", "application/json")
    }

    const response = await fetchImpl(url, {
      ...requestInit,
      method,
      headers,
      body: encryptedBody,
      credentials: requestInit.credentials ?? "include",
    })

    if (response.status === 204 || response.status === 304) {
      return {
        data: undefined as T,
        status: response.status,
        headers: response.headers,
      }
    }

    const wireEnvelope = decodeTransportEnvelope(
      (await response.json()) as unknown,
    )

    if (wireEnvelope.keyId !== transportSession.keyId) {
      throw new TransportRequestError(
        "The transport response key does not match the session.",
        response.status,
        "transport_error",
      )
    }

    const plaintext = await decryptAesGcm(
      transportSession.aesKey,
      wireEnvelope,
      additionalData,
    )
    const responsePayload = parseLogicalResponsePayload(
      parseJson(plaintext, "The transport response descriptor is invalid."),
    )
    const logicalHeaders = new Headers(response.headers)

    for (const [name, value] of Object.entries(responsePayload.headers)) {
      logicalHeaders.set(name, value)
    }

    const data = decodeLogicalResponseBody(responsePayload)

    if (!response.ok) {
      throw createResponseError(response.status, logicalHeaders, data)
    }

    return {
      data: data as T,
      status: response.status,
      headers: logicalHeaders,
      contentType: responsePayload.contentType,
    }
  }
}

async function encryptRequestBody(
  logicalBody: unknown,
  headers: Headers,
  key: CryptoKey,
  additionalData: Uint8Array,
  keyId: string,
): Promise<string> {
  const contentType = headers.get("Content-Type") ?? "application/json"
  const descriptor =
    logicalBody instanceof Uint8Array
      ? new TextEncoder().encode(
          JSON.stringify(serializeBinaryPayload(logicalBody, contentType)),
        )
      : serializeJsonPayload(logicalBody)
  const encrypted = await encryptAesGcm(key, descriptor, additionalData)

  return JSON.stringify(
    encodeTransportEnvelope({
      version: 1,
      algorithm: "A256GCM",
      keyId,
      ...encrypted,
    }),
  )
}

function parseJson(bytes: Uint8Array, message: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new TransportRequestError(message, 0, "transport_error")
  }
}

function readCsrfToken(value: unknown): string {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    typeof value.data.csrfToken !== "string"
  ) {
    throw new TransportRequestError(
      "The CSRF token response is invalid.",
      0,
      "transport_error",
    )
  }

  const token = value.data.csrfToken.trim()

  if (!token) {
    throw new TransportRequestError(
      "The CSRF token response is invalid.",
      0,
      "transport_error",
    )
  }

  return token
}

function createResponseError(
  status: number,
  headers: Headers,
  data: unknown,
): TransportRequestError {
  const apiError = readApiError(data)

  return new TransportRequestError(
    apiError?.message ?? `The API request failed with status ${status}.`,
    status,
    apiError?.code ?? "api_error",
    headers.get("x-request-id") ?? undefined,
    data,
  )
}

type ApiErrorPayload = {
  code?: string
  message?: string
}

function readApiError(value: unknown): ApiErrorPayload | undefined {
  if (!isRecord(value) || !isRecord(value.error)) {
    return undefined
  }

  const code =
    typeof value.error.code === "string" ? value.error.code : undefined
  const message =
    typeof value.error.message === "string" ? value.error.message : undefined
  return { code, message }
}

function resolveUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
