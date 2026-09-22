import { describe, expect, it } from "vitest"

import {
  buildAdditionalData,
  decodeTransportEnvelope,
  encodeTransportEnvelope,
} from "../../src/shared/api/transport/envelope"

const validEnvelope = {
  version: 1 as const,
  algorithm: "A256GCM" as const,
  keyId: "transport-2026-01",
  iv: new Uint8Array(12),
  ciphertext: new Uint8Array(16),
}

describe("transport envelopes", () => {
  it("binds the method and normalized path while excluding the query", () => {
    expect(buildAdditionalData("post", "/api/v1/sales?retry=1")).toBe(
      "POST /api/v1/sales",
    )
    expect(
      buildAdditionalData("GET", "https://example.test/api/v1/medicines?q=x"),
    ).toBe("GET /api/v1/medicines")
  })

  it("rejects invalid absolute schemes and control characters", () => {
    expect(() => buildAdditionalData("GET", "ftp://example.test/data")).toThrow(
      "request target",
    )
    expect(() => buildAdditionalData("GET", "/api/v1/\nmedicines")).toThrow(
      "request target",
    )
    expect(() => buildAdditionalData("get-now", "/api/v1/medicines")).toThrow(
      "HTTP method",
    )
  })

  it("round trips the exact Laravel envelope shape", () => {
    const encoded = encodeTransportEnvelope(validEnvelope)
    const decoded = decodeTransportEnvelope(encoded)

    expect(Object.keys(encoded).sort()).toEqual([
      "algorithm",
      "ciphertext",
      "iv",
      "keyId",
      "version",
    ])
    expect(decoded).toEqual(validEnvelope)
  })

  it("rejects extra fields, invalid key IDs, short tags, and oversized ciphertext", () => {
    const encoded = encodeTransportEnvelope(validEnvelope)

    expect(() =>
      decodeTransportEnvelope({ ...encoded, extra: "rejected" }),
    ).toThrow("envelope")
    expect(() =>
      decodeTransportEnvelope({ ...encoded, keyId: "contains spaces" }),
    ).toThrow("envelope")
    expect(() =>
      decodeTransportEnvelope({
        ...encoded,
        ciphertext: "AA",
      }),
    ).toThrow("envelope")
    expect(() =>
      encodeTransportEnvelope({
        ...validEnvelope,
        ciphertext: new Uint8Array(1_048_577),
      }),
    ).toThrow("envelope")
  })
})
