import { decodeBase64Url, encodeBase64Url } from "./base64url"

const KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

const IV_LENGTH = 12

const TAG_LENGTH = 16

const MAX_CIPHERTEXT_LENGTH = 1_048_576

export type TransportEnvelope = {
  version: 1

  algorithm: "A256GCM"

  keyId: string

  iv: Uint8Array

  ciphertext: Uint8Array
}

export type TransportEnvelopePayload = {
  version: number

  algorithm: string

  keyId: string

  iv: string

  ciphertext: string
}

export function buildAdditionalData(
  method: string,

  requestTarget: string,
): string {
  const normalizedMethod = method.toUpperCase()

  if (!/^[A-Z]+$/.test(normalizedMethod)) {
    throw new Error("The HTTP method is invalid.")
  }

  if (!requestTarget || /[\u0000-\u0020\u007f]/.test(requestTarget)) {
    throw new Error("The request target is invalid.")
  }

  let path = requestTarget

  try {
    const parsed = new URL(requestTarget, "https://transport.invalid")

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("The request target is invalid.")
    }

    path = parsed.pathname || "/"
  } catch {
    const pathWithoutQuery = requestTarget.split("?", 1)[0]

    path = pathWithoutQuery.startsWith("/")
      ? pathWithoutQuery
      : `/${pathWithoutQuery}`
  }

  return `${normalizedMethod} ${path || "/"}`
}

export function encodeTransportEnvelope(
  envelope: TransportEnvelope,
): TransportEnvelopePayload {
  validateEnvelope(envelope)

  return {
    version: envelope.version,

    algorithm: envelope.algorithm,

    keyId: envelope.keyId,

    iv: encodeBase64Url(envelope.iv),

    ciphertext: encodeBase64Url(envelope.ciphertext),
  }
}

export function decodeTransportEnvelope(payload: unknown): TransportEnvelope {
  if (!payload || typeof payload !== "object") {
    throw invalidEnvelope()
  }

  const value = payload as Partial<TransportEnvelopePayload>

  if (
    value.version !== 1 ||
    value.algorithm !== "A256GCM" ||
    typeof value.keyId !== "string" ||
    typeof value.iv !== "string" ||
    typeof value.ciphertext !== "string"
  ) {
    throw invalidEnvelope()
  }

  let iv: Uint8Array

  let ciphertext: Uint8Array

  try {
    iv = decodeBase64Url(value.iv)

    ciphertext = decodeBase64Url(value.ciphertext)
  } catch {
    throw invalidEnvelope()
  }

  const envelope = {
    version: 1 as const,

    algorithm: "A256GCM" as const,

    keyId: value.keyId,

    iv,

    ciphertext,
  }

  validateEnvelope(envelope)

  return envelope
}

function validateEnvelope(envelope: TransportEnvelope): void {
  if (
    envelope.version !== 1 ||
    envelope.algorithm !== "A256GCM" ||
    !KEY_ID_PATTERN.test(envelope.keyId) ||
    envelope.iv.byteLength !== IV_LENGTH ||
    envelope.ciphertext.byteLength < TAG_LENGTH ||
    envelope.ciphertext.byteLength > MAX_CIPHERTEXT_LENGTH
  ) {
    throw invalidEnvelope()
  }
}

function invalidEnvelope(): Error {
  return new Error("The transport envelope is invalid.")
}
