import assert from "node:assert/strict"
import { test } from "node:test"
import { encodeBase64Url } from "@/shared/api/transport/base64url"
import {
  decryptAesGcm,
  encryptAesGcm,
  generateAes256Key,
  importRsaOaepPublicKey,
  wrapAesKey,
} from "@/shared/api/transport/crypto"
import {
  buildAdditionalData,
  decodeTransportEnvelope,
} from "@/shared/api/transport/envelope"

test("transport AAD normalizes the method and excludes the query", () => {
  assert.equal(
    buildAdditionalData("post", "/api/v1/medicines?search=paracetamol"),
    "POST /api/v1/medicines",
  )
})

test("transport AAD rejects invalid request targets", () => {
  assert.throws(() => buildAdditionalData("GET", ""), /request target/i)
  assert.equal(
    buildAdditionalData("GET", "api/v1/medicines"),
    "GET /api/v1/medicines",
  )
  assert.throws(
    () => buildAdditionalData("G ET", "/api/v1/medicines"),
    /method/i,
  )
})

test("transport envelopes require the canonical AES-256-GCM shape", () => {
  const validEnvelope = {
    version: 1,
    algorithm: "A256GCM",
    keyId: "primary-2026",
    iv: encodeBase64Url(new Uint8Array(12)),
    ciphertext: encodeBase64Url(new Uint8Array(16)),
  }

  assert.deepEqual(decodeTransportEnvelope(validEnvelope), {
    ...validEnvelope,
    iv: new Uint8Array(12),
    ciphertext: new Uint8Array(16),
  })
  assert.throws(
    () => decodeTransportEnvelope({ ...validEnvelope, algorithm: "AES-GCM" }),
    /envelope/i,
  )
  assert.throws(
    () =>
      decodeTransportEnvelope({
        ...validEnvelope,
        iv: encodeBase64Url(new Uint8Array(11)),
      }),
    /envelope/i,
  )
  assert.throws(
    () =>
      decodeTransportEnvelope({
        ...validEnvelope,
        ciphertext: encodeBase64Url(new Uint8Array(15)),
      }),
    /envelope/i,
  )
})

test("AES-GCM authenticates the method and path", async () => {
  const { key } = await generateAes256Key()
  const encrypted = await encryptAesGcm(
    key,
    new TextEncoder().encode('{"ok":true}'),
    "POST",
    "/api/v1/sales",
  )

  assert.deepEqual(
    await decryptAesGcm(key, encrypted, "POST", "/api/v1/sales"),
    new TextEncoder().encode('{"ok":true}'),
  )
  await assert.rejects(
    decryptAesGcm(key, encrypted, "POST", "/api/v1/other"),
    /authentication/i,
  )
})

test("RSA-OAEP wraps a fresh AES-256 key", async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )
  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  )
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${toBase64(publicKeyBytes)}\n-----END PUBLIC KEY-----`
  const { rawKey } = await generateAes256Key()
  const wrappedKey = await wrapAesKey(
    await importRsaOaepPublicKey(publicKeyPem),
    rawKey,
  )
  const unwrappedKey = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      keyPair.privateKey,
      toArrayBuffer(wrappedKey),
    ),
  )

  assert.deepEqual(unwrappedKey, rawKey)
})

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}
