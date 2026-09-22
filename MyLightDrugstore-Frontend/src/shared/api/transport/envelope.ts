import { decodeBase64Url, encodeBase64Url } from "./base64url"
import {
  TRANSPORT_ALGORITHM,
  TRANSPORT_VERSION,
  type EncryptedTransportEnvelope,
} from "./types"

const KEY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
const IV_LENGTH = 12
const TAG_LENGTH = 16
const MAX_CIPHERTEXT_LENGTH = 1_048_576
const MAX_ENCODED_CIPHERTEXT_LENGTH = 1_398_102

export type TransportEnvelope = {
  version: typeof TRANSPORT_VERSION
  algorithm: typeof TRANSPORT_ALGORITHM
  keyId: string
  iv: Uint8Array
  ciphertext: Uint8Array
}

export type TransportEnvelopePayload = EncryptedTransportEnvelope

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

  const path = normalizeRequestPath(requestTarget)
  return `${normalizedMethod} ${path}`
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
  if (!isRecord(payload)) {
    throw invalidEnvelope()
  }

  const expectedFields = ["version", "algorithm", "keyId", "iv", "ciphertext"]
  const actualFields = Object.keys(payload)

  if (
    actualFields.length !== expectedFields.length ||
    actualFields.some((field) => !expectedFields.includes(field))
  ) {
    throw invalidEnvelope()
  }

  if (
    payload.version !== TRANSPORT_VERSION ||
    payload.algorithm !== TRANSPORT_ALGORITHM ||
    typeof payload.keyId !== "string" ||
    typeof payload.iv !== "string" ||
    typeof payload.ciphertext !== "string" ||
    payload.ciphertext.length > MAX_ENCODED_CIPHERTEXT_LENGTH
  ) {
    throw invalidEnvelope()
  }

  let iv: Uint8Array
  let ciphertext: Uint8Array

  try {
    iv = decodeBase64Url(payload.iv)
    ciphertext = decodeBase64Url(payload.ciphertext)
  } catch {
    throw invalidEnvelope()
  }

  const envelope: TransportEnvelope = {
    version: TRANSPORT_VERSION,
    algorithm: TRANSPORT_ALGORITHM,
    keyId: payload.keyId,
    iv,
    ciphertext,
  }

  validateEnvelope(envelope)
  return envelope
}

function normalizeRequestPath(requestTarget: string): string {
  const absoluteUrl = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(requestTarget)

  if (absoluteUrl) {
    let parsed: URL

    try {
      parsed = new URL(requestTarget)
    } catch {
      throw new Error("The request target is invalid.")
    }

    if (!/^https?:$/.test(parsed.protocol) || !parsed.host) {
      throw new Error("The request target is invalid.")
    }

    return parsed.pathname || "/"
  }

  if (requestTarget.startsWith("//")) {
    throw new Error("The request target is invalid.")
  }

  const pathWithoutQuery = requestTarget.split("?", 1)[0]
  return pathWithoutQuery.startsWith("/")
    ? pathWithoutQuery || "/"
    : `/${pathWithoutQuery}`
}

function validateEnvelope(envelope: TransportEnvelope): void {
  if (
    envelope.version !== TRANSPORT_VERSION ||
    envelope.algorithm !== TRANSPORT_ALGORITHM ||
    !KEY_ID_PATTERN.test(envelope.keyId) ||
    envelope.iv.byteLength !== IV_LENGTH ||
    envelope.ciphertext.byteLength < TAG_LENGTH ||
    envelope.ciphertext.byteLength > MAX_CIPHERTEXT_LENGTH
  ) {
    throw invalidEnvelope()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function invalidEnvelope(): Error {
  return new Error("The transport envelope is invalid.")
}
