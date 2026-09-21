import assert from "node:assert/strict"
import { test } from "node:test"
import { encodeBase64Url } from "@/shared/api/transport/base64url"
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
  assert.throws(() => buildAdditionalData("G ET", "/api/v1/medicines"), /method/i)
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
    () => decodeTransportEnvelope({ ...validEnvelope, iv: encodeBase64Url(new Uint8Array(11)) }),
    /envelope/i,
  )
  assert.throws(
    () => decodeTransportEnvelope({ ...validEnvelope, ciphertext: encodeBase64Url(new Uint8Array(15)) }),
    /envelope/i,
  )
})
