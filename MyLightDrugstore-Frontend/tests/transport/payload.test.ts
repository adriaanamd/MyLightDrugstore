import { describe, expect, it } from "vitest"

import {
  decodeLogicalResponseBody,
  parseLogicalResponsePayload,
  serializeBinaryPayload,
  serializeJsonPayload,
} from "../../src/shared/api/transport/payload"

describe("transport logical payloads", () => {
  it("serializes JSON as a typed request descriptor", () => {
    const bytes = serializeJsonPayload({ medicineId: 42, quantity: 2 })
    const descriptor = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as Record<string, unknown>

    expect(descriptor).toEqual({
      kind: "json",
      contentType: "application/json",
      value: '{"medicineId":42,"quantity":2}',
    })
  })

  it("serializes binary bytes with a content type", () => {
    expect(
      serializeBinaryPayload(Uint8Array.from([1, 2, 3]), "application/zip"),
    ).toEqual({
      kind: "bytes",
      contentType: "application/zip",
      value: "AQID",
    })
  })

  it("validates and decodes UTF-8 JSON and base64 response bodies", () => {
    const jsonPayload = parseLogicalResponsePayload({
      contentType: "application/json",
      headers: { "x-request-id": "req-1" },
      body: '{"data":{"id":42}}',
      bodyEncoding: "utf8",
    })
    const binaryPayload = parseLogicalResponsePayload({
      contentType: "application/zip",
      headers: {},
      body: "AAEC",
      bodyEncoding: "base64",
    })

    expect(decodeLogicalResponseBody(jsonPayload)).toEqual({
      data: { id: 42 },
    })
    expect(decodeLogicalResponseBody(binaryPayload)).toEqual(
      Uint8Array.from([0, 1, 2]),
    )
  })

  it.each([
    null,
    { contentType: "application/json", body: "{}" },
    {
      contentType: "application/json",
      headers: { "": "invalid" },
      body: "{}",
      bodyEncoding: "utf8",
    },
  ])("rejects malformed logical response %j", (value) => {
    expect(() => parseLogicalResponsePayload(value)).toThrow(
      "response descriptor",
    )
  })

  it("rejects request payloads larger than the transport limit", () => {
    expect(() =>
      serializeBinaryPayload(
        new Uint8Array(1_400_001),
        "application/octet-stream",
      ),
    ).toThrow("too large")
  })
})
