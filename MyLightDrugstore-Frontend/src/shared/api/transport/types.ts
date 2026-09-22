export const TRANSPORT_VERSION = 1 as const

export const TRANSPORT_ALGORITHM = "A256GCM" as const

export type TransportPublicKey = {
  version: typeof TRANSPORT_VERSION
  algorithm: "RSA-OAEP-256"
  transportAlgorithm: typeof TRANSPORT_ALGORITHM
  keyId: string
  publicKey: string
}

export type TransportCiphertext = {
  iv: Uint8Array
  ciphertext: Uint8Array
}

export type EncryptedTransportEnvelope = {
  version: typeof TRANSPORT_VERSION
  algorithm: typeof TRANSPORT_ALGORITHM
  keyId: string
  iv: string
  ciphertext: string
}

export type TransportRequestPayload = {
  kind: "json" | "bytes"
  contentType: string
  value: string
}

export type TransportResponsePayload = {
  contentType: string
  headers: Record<string, string>
  body: string
  bodyEncoding: "utf8" | "base64"
}
