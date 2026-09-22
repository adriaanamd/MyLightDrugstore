import { describe, expect, it } from "vitest"

import {
  decodeTransportEnvelope,
  encodeTransportEnvelope,
} from "../../src/shared/api/transport/envelope"
import {
  decryptAesGcm,
  encryptAesGcm,
} from "../../src/shared/api/transport/crypto"
import {
  createTransportClient,
  type TransportClient,
} from "../../src/shared/api/transport/client"

type RsaTestKeys = {
  privateKey: CryptoKey
  publicKeyPem: string
}

async function createRsaTestKeys(): Promise<RsaTestKeys> {
  const keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: Uint8Array.from([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )) as CryptoKeyPair
  const spki = new Uint8Array(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  )
  let binary = ""

  for (const byte of spki) {
    binary += String.fromCharCode(byte)
  }

  const lines =
    btoa(binary)
      .match(/.{1,64}/g)
      ?.join("\n") ?? ""
  return {
    privateKey: keyPair.privateKey,
    publicKeyPem: `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`,
  }
}

async function unwrapSessionKey(
  privateKey: CryptoKey,
  header: string,
): Promise<CryptoKey> {
  const wrappedKey = header.split(".", 2)[1]
  const rawKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    decodeBase64UrlForTest(wrappedKey),
  )

  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

async function encryptedResponse(
  key: CryptoKey,
  keyId: string,
  method: string,
  path: string,
  status: number,
  body: unknown,
): Promise<Response> {
  const descriptor = new TextEncoder().encode(
    JSON.stringify({
      contentType: "application/json",
      headers: { "x-request-id": "req-test-1" },
      body: JSON.stringify(body),
      bodyEncoding: "utf8",
    }),
  )
  const encrypted = await encryptAesGcm(
    key,
    descriptor,
    new TextEncoder().encode(`${method} ${path}`),
  )

  return new Response(
    JSON.stringify(
      encodeTransportEnvelope({
        version: 1,
        algorithm: "A256GCM",
        keyId,
        ...encrypted,
      }),
    ),
    { status, headers: { "content-type": "application/json" } },
  )
}

function decodeBase64UrlForTest(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(
    base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="),
  )
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

describe("encrypted transport client", () => {
  it("bootstraps CSRF, encrypts a JSON request, and decrypts JSON response", async () => {
    const keys = await createRsaTestKeys()
    const calls: Array<{ method: string path: string body: string | null }> = []
    const client = createTransportClient({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async (input, init): Promise<Response> => {
        const url = new URL(String(input))
        const method = (init?.method ?? "GET").toUpperCase()
        const body = typeof init?.body === "string" ? init.body : null
        calls.push({ method, path: url.pathname, body })

        if (url.pathname.endsWith("/transport/public-key")) {
          return new Response(
            JSON.stringify({
              data: {
                version: 1,
                algorithm: "RSA-OAEP-256",
                transportAlgorithm: "A256GCM",
                keyId: "transport-2026-01",
                publicKey: keys.publicKeyPem,
              },
            }),
            { status: 200 },
          )
        }

        const headers = new Headers(init?.headers)
        const keyIdHeader = headers.get("X-Transport-Key")
        if (!keyIdHeader) throw new Error("transport key header missing")
        const keyId = keyIdHeader.split(".", 1)[0]
        const aesKey = await unwrapSessionKey(keys.privateKey, keyIdHeader)

        if (url.pathname.endsWith("/auth/csrf")) {
          return encryptedResponse(aesKey, keyId, method, url.pathname, 200, {
            data: { csrfToken: "csrf-token-1" },
          })
        }

        if (url.pathname.endsWith("/sales")) {
          if (!body) throw new Error("encrypted request body missing")
          const requestEnvelope = decodeTransportEnvelope(JSON.parse(body))
          const requestPlaintext = await decryptAesGcm(
            aesKey,
            requestEnvelope,
            new TextEncoder().encode(`${method} ${url.pathname}`),
          )
          expect(
            JSON.parse(new TextDecoder().decode(requestPlaintext)),
          ).toEqual({
            kind: "json",
            contentType: "application/json",
            value: '{"items":[{"medicineId":42,"quantity":2}]}',
          })
          expect(headers.get("X-CSRF-TOKEN")).toBe("csrf-token-1")
          return encryptedResponse(aesKey, keyId, method, url.pathname, 201, {
            data: { id: 900 },
          })
        }

        throw new Error(`unexpected path ${url.pathname}`)
      },
    })

    const response = await client.request<{ data: { id: number } }>("/sales", {
      method: "POST",
      body: { items: [{ medicineId: 42, quantity: 2 }] },
    })

    expect(response.status).toBe(201)
    expect(response.data).toEqual({ data: { id: 900 } })
    expect(calls.map((call) => call.path)).toEqual([
      "/api/v1/transport/public-key",
      "/api/v1/auth/csrf",
      "/api/v1/sales",
    ])
  })

  it("returns empty data for no-content responses without fabricating a body", async () => {
    const keys = await createRsaTestKeys()
    let client: TransportClient | undefined
    client = createTransportClient({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async (input, init): Promise<Response> => {
        const url = new URL(String(input))
        if (url.pathname.endsWith("/transport/public-key")) {
          return new Response(
            JSON.stringify({
              data: {
                version: 1,
                algorithm: "RSA-OAEP-256",
                transportAlgorithm: "A256GCM",
                keyId: "transport-2026-01",
                publicKey: keys.publicKeyPem,
              },
            }),
            { status: 200 },
          )
        }

        const header = new Headers(init?.headers).get("X-Transport-Key")
        expect(header).not.toBeNull()
        return new Response(null, { status: 204 })
      },
    })

    const response = await client.request<void>("/auth/logout", {
      method: "POST",
      skipCsrf: true,
    })

    expect(response.data).toBeUndefined()
  })

  it("normalizes an encrypted API error without exposing transport internals", async () => {
    const keys = await createRsaTestKeys()
    const client = createTransportClient({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async (input, init): Promise<Response> => {
        const url = new URL(String(input))
        if (url.pathname.endsWith("/transport/public-key")) {
          return new Response(
            JSON.stringify({
              data: {
                version: 1,
                algorithm: "RSA-OAEP-256",
                transportAlgorithm: "A256GCM",
                keyId: "transport-2026-01",
                publicKey: keys.publicKeyPem,
              },
            }),
            { status: 200 },
          )
        }

        const header = new Headers(init?.headers).get("X-Transport-Key")
        if (!header) throw new Error("transport key header missing")
        const key = await unwrapSessionKey(keys.privateKey, header)
        return encryptedResponse(
          key,
          header.split(".", 1)[0],
          "GET",
          url.pathname,
          422,
          {
            error: {
              code: "validation_failed",
              message: "The request is invalid.",
            },
          },
        )
      },
    })

    await expect(client.request("/medicines")).rejects.toMatchObject({
      status: 422,
      code: "validation_failed",
      message: "The request is invalid.",
    })
  })
})
