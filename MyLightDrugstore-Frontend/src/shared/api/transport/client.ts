import {
  decryptAesGcm,
  encryptAesGcm,
  generateAes256Key,
  importRsaOaepPublicKey,
  wrapAesKey,
} from "./crypto"
import { decodeTransportEnvelope, encodeTransportEnvelope } from "./envelope"
import { encodeBase64Url } from "./base64url"
import { TransportRequestError } from "./errors"

type TransportRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown
}

type PublicKeyPayload = {
  data: {
    version: 1
    algorithm: "RSA-OAEP-256"
    transportAlgorithm: "A256GCM"
    keyId: string
    publicKey: string
  }
}

type ResponseDescriptor = {
  contentType: string
  headers: Record<string, string>
  body: string
  bodyEncoding: "utf8" | "base64"
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
}

export type TransportClientOptions = {
  baseUrl: string
  fetchImpl?: typeof fetch
}

type TransportSession = {
  keyId: string
  aesKey: CryptoKey
  wrappedKey: string
}

export function createTransportClient({
  baseUrl,
  fetchImpl = fetch,
}: TransportClientOptions): TransportClient {
  let sessionPromise: Promise<TransportSession> | undefined

  return {
    async request<T,>(path: string, init: TransportRequestInit = {}) {
      const method = (init.method ?? "GET").toUpperCase()
      const url = resolveUrl(baseUrl, path)
      const session = await getSession()
      const headers = new Headers(init.headers)
      headers.set("Accept", "application/json")
      headers.set("X-Transport-Key", `${session.keyId}.${session.wrappedKey}`)

      let body: string | undefined
      if (init.body !== undefined) {
        const descriptor = JSON.stringify({
          kind: "json",
          contentType: "application/json",
          value: JSON.stringify(init.body),
        })
        const encrypted = await encryptAesGcm(
          session.aesKey,
          new TextEncoder().encode(descriptor),
          method,
          new URL(url, "https://transport.invalid").pathname,
        )
        headers.set("Content-Type", "application/json")
        body = JSON.stringify(
          encodeTransportEnvelope({
            version: 1,
            algorithm: "A256GCM",
            keyId: session.keyId,
            ...encrypted,
          }),
        )
      }

      const response = await fetchImpl(url, {
        ...init,
        method,
        headers,
        body,
        credentials: init.credentials ?? "include",
      })

      if (response.status === 204 || response.status === 304) {
        return {
          data: undefined as T,
          status: response.status,
          headers: response.headers,
        }
      }

      const wireEnvelope = decodeTransportEnvelope(await response.json())
      if (wireEnvelope.keyId !== session.keyId) {
        throw new TransportRequestError(
          "The transport response key does not match the session.",
          response.status,
          "transport_error",
        )
      }

      const plaintext = await decryptAesGcm(
        session.aesKey,
        wireEnvelope,
        method,
        new URL(url, "https://transport.invalid").pathname,
      )
      const descriptor = parseResponseDescriptor(plaintext)
      const logicalHeaders = new Headers(response.headers)
      for (const [name, value] of Object.entries(descriptor.headers)) {
        logicalHeaders.set(name, value)
      }
      const data = decodeResponseBody(descriptor)

      if (!response.ok) {
        throw createResponseError(response, logicalHeaders, data)
      }

      return {
        data: data as T,
        status: response.status,
        headers: logicalHeaders,
        contentType: descriptor.contentType,
      }
    },
  }

  async function getSession(): Promise<TransportSession> {
    sessionPromise ??= establishSession()
    try {
      return await sessionPromise
    } catch (error) {
      sessionPromise = undefined
      throw error
    }
  }

  async function establishSession(): Promise<TransportSession> {
    const response = await fetchImpl(
      resolveUrl(baseUrl, "/transport/public-key"),
      {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      },
    )

    if (!response.ok) {
      throw new TransportRequestError(
        "The transport public key could not be loaded.",
        response.status,
        "transport_key_unavailable",
      )
    }

    const payload = (await response.json()) as PublicKeyPayload
    const publicKey = await importRsaOaepPublicKey(payload.data.publicKey)
    const { key: aesKey, rawKey } = await generateAes256Key()
    const wrappedKey = encodeBase64Url(await wrapAesKey(publicKey, rawKey))

    return { keyId: payload.data.keyId, aesKey, wrappedKey }
  }
}

function resolveUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`
}

function parseResponseDescriptor(bytes: Uint8Array): ResponseDescriptor {
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new TransportRequestError(
      "The transport response descriptor is invalid.",
      0,
      "transport_error",
    )
  }

  if (!isResponseDescriptor(parsed)) {
    throw new TransportRequestError(
      "The transport response descriptor is invalid.",
      0,
      "transport_error",
    )
  }

  return parsed
}

function isResponseDescriptor(value: unknown): value is ResponseDescriptor {
  if (!value || typeof value !== "object") return false
  const descriptor = value as Partial<ResponseDescriptor>
  return (
    typeof descriptor.contentType === "string" &&
    typeof descriptor.body === "string" &&
    (descriptor.bodyEncoding === "utf8" ||
      descriptor.bodyEncoding === "base64") &&
    !!descriptor.headers &&
    typeof descriptor.headers === "object" &&
    Object.values(descriptor.headers).every(
      (header) => typeof header === "string",
    )
  )
}

function decodeResponseBody(descriptor: ResponseDescriptor): unknown {
  if (descriptor.bodyEncoding === "base64") {
    return decodeBase64(descriptor.body)
  }

  if (descriptor.contentType.toLowerCase().includes("json")) {
    try {
      return JSON.parse(descriptor.body)
    } catch {
      return descriptor.body
    }
  }

  return descriptor.body
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function createResponseError(
  response: Response,
  headers: Headers,
  data: unknown,
): TransportRequestError {
  const error = isErrorPayload(data) ? data.error : undefined
  return new TransportRequestError(
    error?.message ?? `The API request failed with status ${response.status}.`,
    response.status,
    error?.code ?? "api_error",
    headers.get("x-request-id") ?? undefined,
    data,
  )
}

function isErrorPayload(
  value: unknown,
): value is {
  error: {
    code?: string
    message?: string
  }
} {
  if (!value || typeof value !== "object" || !("error" in value)) return false
  const error = value.error
  return !!error && typeof error === "object"
}
