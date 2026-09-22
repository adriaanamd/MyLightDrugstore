import { describe, expect, it } from "vitest"

import { createAuthClient } from "../../src/features/auth/api/auth-client"
import { normalizeApiError } from "../../src/shared/api"
import { createApiClient } from "../../src/shared/api/api-client"
import {
  decryptAesGcm,
  encryptAesGcm,
} from "../../src/shared/api/transport/crypto"
import {
  decodeTransportEnvelope,
  encodeTransportEnvelope,
} from "../../src/shared/api/transport/envelope"

type TestKeys = { privateKey: CryptoKey publicKeyPem: string }

async function createKeys(): Promise<TestKeys> {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: Uint8Array.from([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )) as CryptoKeyPair
  const bytes = new Uint8Array(
    await crypto.subtle.exportKey("spki", pair.publicKey),
  )
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const lines =
    btoa(binary)
      .match(/.{1,64}/g)
      ?.join("\n") ?? ""

  return {
    privateKey: pair.privateKey,
    publicKeyPem: `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`,
  }
}

function decodeBase64Url(value: string): ArrayBuffer {
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

async function unwrapKey(
  privateKey: CryptoKey,
  header: string,
): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    decodeBase64Url(header.split(".", 2)[1]),
  )
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

async function response(
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
      headers: { "x-request-id": "integration-request" },
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

describe("encrypted API integration contract", () => {
  it("uses encrypted login, CSRF, and response mapping end to end", async () => {
    const keys = await createKeys()
    const paths: string[] = []
    const api = createApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async (input, init): Promise<Response> => {
        const url = new URL(String(input))
        const method = (init?.method ?? "GET").toUpperCase()
        paths.push(`${method} ${url.pathname}`)
        if (url.pathname.endsWith("/transport/public-key")) {
          return new Response(
            JSON.stringify({
              data: {
                version: 1,
                algorithm: "RSA-OAEP-256",
                transportAlgorithm: "A256GCM",
                keyId: "integration-key",
                publicKey: keys.publicKeyPem,
              },
            }),
          )
        }

        const headers = new Headers(init?.headers)
        const transportHeader = headers.get("X-Transport-Key")
        if (!transportHeader) throw new Error("missing transport key")
        const key = await unwrapKey(keys.privateKey, transportHeader)
        const keyId = transportHeader.split(".", 1)[0]
        if (url.pathname.endsWith("/auth/csrf")) {
          return response(key, keyId, method, url.pathname, 200, {
            data: { csrfToken: "integration-csrf" },
          })
        }

        expect(headers.get("X-CSRF-TOKEN")).toBe("integration-csrf")
        const envelope = decodeTransportEnvelope(JSON.parse(String(init?.body)))
        const plaintext = await decryptAesGcm(
          key,
          envelope,
          new TextEncoder().encode(`${method} ${url.pathname}`),
        )
        expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual({
          kind: "json",
          contentType: "application/json",
          value: '{"username":"ada","password":"password"}',
        })
        return response(key, keyId, method, url.pathname, 200, {
          data: {
            id: 7,
            username: "ada",
            fullName: "Ada",
            role: "staff",
            active: true,
          },
        })
      },
    })

    const auth = createAuthClient(api.transport)
    await expect(
      auth.login({ username: "ada", password: "password" }),
    ).resolves.toMatchObject({
      id: 7,
      username: "ada",
      role: "staff",
    })
    expect(paths).toEqual([
      "GET /api/v1/transport/public-key",
      "GET /api/v1/auth/csrf",
      "POST /api/v1/auth/login",
    ])
  })

  it("maps encrypted API errors to the public ApiError contract", async () => {
    const keys = await createKeys()
    const api = createApiClient({
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
                keyId: "error-key",
                publicKey: keys.publicKeyPem,
              },
            }),
          )
        }
        const header = new Headers(init?.headers).get("X-Transport-Key")
        if (!header) throw new Error("missing transport key")
        const key = await unwrapKey(keys.privateKey, header)
        return response(
          key,
          header.split(".", 1)[0],
          "GET",
          url.pathname,
          422,
          {
            error: { code: "validation_error", message: "Invalid credentials" },
          },
        )
      },
    })

    try {
      await api.transport.request("/auth/me", { method: "GET" })
      expect.fail("request should reject")
    } catch (cause: unknown) {
      const error = normalizeApiError(cause)
      expect(error.code).toBe("validation_error")
      expect(error.status).toBe(422)
      expect(error.message).toBe("Invalid credentials")
    }
  })
})
