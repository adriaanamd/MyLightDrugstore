import { describe, expect, it } from "vitest"

import {
  decryptAesGcm,
  encryptAesGcm,
  generateAes256Key,
  wrapAesKey,
} from "../../src/shared/api/transport/crypto"

async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return (await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: Uint8Array.from([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )) as CryptoKeyPair
}

describe("transport cryptography", () => {
  it("generates an AES-256 key and wraps its raw bytes with RSA-OAEP", async () => {
    const { aesKey, rawKey } = await generateAes256Key()
    const rsaKeyPair = await generateRsaKeyPair()
    const wrappedKey = await wrapAesKey(rsaKeyPair.publicKey, rawKey)
    const unwrappedKey = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        rsaKeyPair.privateKey,
        wrappedKey,
      ),
    )

    expect(aesKey).toBeInstanceOf(CryptoKey)
    expect(rawKey).toHaveLength(32)
    expect(unwrappedKey).toEqual(rawKey)
  })

  it("round trips AES-GCM with caller-provided additional data", async () => {
    const { aesKey } = await generateAes256Key()
    const plaintext = new TextEncoder().encode('{"kind":"json"}')
    const aad = new TextEncoder().encode("POST /api/v1/sales")
    const encrypted = await encryptAesGcm(aesKey, plaintext, aad)
    const decrypted = await decryptAesGcm(aesKey, encrypted, aad)

    expect(encrypted.iv).toHaveLength(12)
    expect(encrypted.ciphertext.length).toBeGreaterThanOrEqual(16)
    expect(decrypted).toEqual(plaintext)
  })

  it("rejects tampering and changed additional data", async () => {
    const { aesKey } = await generateAes256Key()
    const aad = new TextEncoder().encode("GET /api/v1/medicines")
    const encrypted = await encryptAesGcm(
      aesKey,
      new TextEncoder().encode("payload"),
      aad,
    )
    const tampered = {
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext.slice(),
    }
    tampered.ciphertext[0] ^= 1

    await expect(decryptAesGcm(aesKey, tampered, aad)).rejects.toThrow(
      "Transport authentication failed.",
    )
    await expect(
      decryptAesGcm(
        aesKey,
        encrypted,
        new TextEncoder().encode("GET /api/v1/sales"),
      ),
    ).rejects.toThrow("Transport authentication failed.")
  })
})
