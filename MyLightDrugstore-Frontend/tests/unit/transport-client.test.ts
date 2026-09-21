import assert from "node:assert/strict"
import { test } from "node:test"
import { decodeBase64Url } from "@/shared/api/transport/base64url"
import { decryptAesGcm, encryptAesGcm } from "@/shared/api/transport/crypto"
import {
  decodeTransportEnvelope,
  encodeTransportEnvelope,
} from "@/shared/api/transport/envelope"
import { createTransportClient } from "@/shared/api/transport/client"
import { TransportRequestError } from "@/shared/api/transport/errors"

test("transport client encrypts JSON and decrypts JSON responses", async () => {
  const keyPair = await createRsaKeyPair()
  const calls: Request[] = []
  const fetchImpl = createMockFetch(keyPair, calls)
  const client = createTransportClient({
    baseUrl: "https://api.example.test/api/v1",
    fetchImpl,
  })

  const response = await client.request<{ medicines: string[] }>("/medicines", {
    method: "POST",
    body: { search: "paracetamol" },
  })

  assert.deepEqual(response.data, { medicines: ["Paracetamol 500mg"] })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("x-request-id"), "req-1")
  assert.equal(calls.length, 1)
  assert.equal(calls[0].headers.get("content-type"), "application/json")
})

test("transport client supports bodyless responses and encrypted errors", async () => {
  const keyPair = await createRsaKeyPair()
  let requestCount = 0
  const fetchImpl = createMockFetch(keyPair, [], () => {
    requestCount += 1
    return requestCount === 1
      ? { status: 204 }
      : {
          status: 422,
          descriptor: {
            contentType: "application/json",
            headers: {},
            body: JSON.stringify({
              error: { code: "validation_failed", message: "Invalid" },
            }),
            bodyEncoding: "utf8",
          },
        }
  })
  const client = createTransportClient({
    baseUrl: "https://api.example.test/api/v1",
    fetchImpl,
  })

  const noContent = await client.request<undefined>("/auth/logout", {
    method: "POST",
  })
  assert.equal(noContent.data, undefined)
  await assert.rejects(
    client.request("/medicines", { method: "POST", body: { name: "" } }),
    (error: unknown) =>
      error instanceof TransportRequestError &&
      error.status === 422 &&
      error.code === "validation_failed",
  )
})

test("transport client decodes binary response descriptors", async () => {
  const keyPair = await createRsaKeyPair()
  const client = createTransportClient({
    baseUrl: "https://api.example.test/api/v1",
    fetchImpl: createMockFetch(keyPair, [], () => ({
      status: 200,
      descriptor: {
        contentType: "application/octet-stream",
        headers: { "content-disposition": "attachment; filename=backup.bin" },
        body: toBase64(new Uint8Array([0, 255, 16])),
        bodyEncoding: "base64",
      },
    })),
  })

  const response = await client.request<Uint8Array>("/backups/latest/download")
  assert.deepEqual(response.data, new Uint8Array([0, 255, 16]))
  assert.equal(
    response.headers.get("content-disposition"),
    "attachment; filename=backup.bin",
  )
})

async function createRsaKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )
}

function createMockFetch(
  keyPair: CryptoKeyPair,
  calls: Request[],
  nextResponse: () => {
    status: number
    descriptor?: Record<string, unknown>
  } = () => ({
    status: 200,
    descriptor: {
      contentType: "application/json",
      headers: { "x-request-id": "req-1" },
      body: JSON.stringify({ medicines: ["Paracetamol 500mg"] }),
      bodyEncoding: "utf8",
    },
  }),
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init)
    if (new URL(request.url).pathname.endsWith("/transport/public-key")) {
      const publicKey = new Uint8Array(
        await crypto.subtle.exportKey("spki", keyPair.publicKey),
      )
      return Response.json({
        data: {
          version: 1,
          algorithm: "RSA-OAEP-256",
          transportAlgorithm: "A256GCM",
          keyId: "primary-2026",
          publicKey: `-----BEGIN PUBLIC KEY-----\n${toBase64(publicKey)}\n-----END PUBLIC KEY-----`,
        },
      })
    }

    calls.push(request)
    const envelope = request.body
      ? decodeTransportEnvelope(await request.json())
      : undefined
    const header = request.headers.get("x-transport-key")
    assert.ok(header)
    const [, wrappedKey] = header.split(".")
    const rawKey = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        keyPair.privateKey,
        toArrayBuffer(decodeBase64Url(wrappedKey)),
      ),
    )
    const aesKey = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(rawKey),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    )
    if (request.body && envelope) {
      const plaintext = await decryptAesGcm(
        aesKey,
        envelope,
        request.method,
        new URL(request.url).pathname,
      )
      const descriptor = JSON.parse(new TextDecoder().decode(plaintext))
      assert.equal(descriptor.kind, "json")
      assert.equal(descriptor.contentType, "application/json")
      assert.equal(typeof descriptor.value, "string")
    }

    const result = nextResponse()
    if (result.status === 204) {
      return new Response(null, { status: 204 })
    }

    const encrypted = await encryptAesGcm(
      aesKey,
      new TextEncoder().encode(JSON.stringify(result.descriptor)),
      request.method,
      new URL(request.url).pathname,
    )
    return Response.json(
      encodeTransportEnvelope({
        version: 1,
        algorithm: "A256GCM",
        keyId: envelope?.keyId ?? "primary-2026",
        ...encrypted,
      }),
      { status: result.status },
    )
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}
