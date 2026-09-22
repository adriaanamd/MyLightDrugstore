import { encodeBase64Url } from "./base64url"
import { generateAes256Key, importRsaOaepPublicKey, wrapAesKey } from "./crypto"
import { TransportRequestError } from "./errors"
import type { TransportPublicKey } from "./types"

export type TransportSession = {
  keyId: string
  aesKey: CryptoKey
  wrappedKey: string
}

export type TransportSessionStore = {
  get(): Promise<TransportSession>
  clear(): void
}

export type TransportSessionOptions = {
  baseUrl: string
  fetchImpl?: typeof fetch
}

export function createTransportSession({
  baseUrl,
  fetchImpl = fetch,
}: TransportSessionOptions): TransportSessionStore {
  let sessionPromise: Promise<TransportSession> | undefined

  return {
    async get(): Promise<TransportSession> {
      sessionPromise ??= establishSession()

      try {
        return await sessionPromise
      } catch (error) {
        sessionPromise = undefined
        throw error
      }
    },

    clear(): void {
      sessionPromise = undefined
    },
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

    const payload: unknown = await response.json()

    if (!isPublicKeyPayload(payload)) {
      throw new TransportRequestError(
        "The transport public key response is invalid.",
        response.status,
        "transport_key_unavailable",
      )
    }

    const publicKey = await importRsaOaepPublicKey(payload.data.publicKey)
    const { aesKey, rawKey } = await generateAes256Key()
    const wrappedKey = encodeBase64Url(await wrapAesKey(publicKey, rawKey))

    return {
      keyId: payload.data.keyId,
      aesKey,
      wrappedKey,
    }
  }
}

function resolveUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`
}

function isPublicKeyPayload(
  value: unknown,
): value is {
  data: TransportPublicKey
} {
  if (!isRecord(value) || !isRecord(value.data)) {
    return false
  }

  return (
    value.data.version === 1 &&
    value.data.algorithm === "RSA-OAEP-256" &&
    value.data.transportAlgorithm === "A256GCM" &&
    typeof value.data.keyId === "string" &&
    value.data.keyId.length > 0 &&
    typeof value.data.publicKey === "string" &&
    value.data.publicKey.length > 0
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
