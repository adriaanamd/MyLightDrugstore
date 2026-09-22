import { describe, expect, it } from "vitest"

import {
  createTransportSession,
  type TransportSession,
} from "../../src/shared/api/transport/session"

async function createPublicKeyPem(): Promise<string> {
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
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`
}

function responseFor(publicKey: string): Response {
  return new Response(
    JSON.stringify({
      data: {
        version: 1,
        algorithm: "RSA-OAEP-256",
        transportAlgorithm: "A256GCM",
        keyId: "transport-2026-01",
        publicKey,
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  )
}

describe("transport session bootstrap", () => {
  it("fetches one public key and reuses the in-flight session", async () => {
    const publicKey = await createPublicKeyPem()
    let calls = 0
    const store = createTransportSession({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async () => {
        calls += 1
        return responseFor(publicKey)
      },
    })

    const [first, second] = await Promise.all([store.get(), store.get()])

    expect(calls).toBe(1)
    expect(first.keyId).toBe("transport-2026-01")
    expect(first).toEqual(second)
    expect(first.wrappedKey.length).toBeGreaterThan(0)
  })

  it("clears the cached session and retries after a bootstrap failure", async () => {
    const publicKey = await createPublicKeyPem()
    let calls = 0
    const store = createTransportSession({
      baseUrl: "https://api.example.test/api/v1",
      fetchImpl: async () => {
        calls += 1
        if (calls === 1) return new Response("unavailable", { status: 503 })
        return responseFor(publicKey)
      },
    })

    await expect(store.get()).rejects.toThrow("public key")
    const session: TransportSession = await store.get()
    store.clear()

    expect(session.keyId).toBe("transport-2026-01")
    expect(calls).toBe(2)
  })
})
