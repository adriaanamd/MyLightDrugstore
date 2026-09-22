import { buildAdditionalData } from "./envelope"

const AES_KEY_LENGTH = 32

const AES_IV_LENGTH = 12

const AES_TAG_LENGTH = 128

export type AesGcmCiphertext = {
  iv: Uint8Array

  ciphertext: Uint8Array
}

export async function generateAes256Key(): Promise<{
  key: CryptoKey

  rawKey: Uint8Array
}> {
  const rawKey = crypto.getRandomValues(new Uint8Array(AES_KEY_LENGTH))

  const key = await crypto.subtle.importKey(
    "raw",

    asArrayBuffer(rawKey),

    { name: "AES-GCM" },

    false,

    ["encrypt", "decrypt"],
  )

  return { key, rawKey }
}

export async function importRsaOaepPublicKey(
  publicKeyPem: string,
): Promise<CryptoKey> {
  const normalizedPem = publicKeyPem.replace(/\\n/g, "\n")
  const encodedKey = normalizedPem

    .replace("-----BEGIN PUBLIC KEY-----", "")

    .replace("-----END PUBLIC KEY-----", "")

    .replace(/\s/g, "")

  const binaryKey = atob(encodedKey)

  const keyBytes = new Uint8Array(binaryKey.length)

  for (let index = 0; index < binaryKey.length; index += 1) {
    keyBytes[index] = binaryKey.charCodeAt(index)
  }

  return crypto.subtle.importKey(
    "spki",

    asArrayBuffer(keyBytes),

    { name: "RSA-OAEP", hash: "SHA-256" },

    false,

    ["encrypt"],
  )
}

export async function wrapAesKey(
  publicKey: CryptoKey,

  rawKey: Uint8Array,
): Promise<Uint8Array> {
  if (rawKey.byteLength !== AES_KEY_LENGTH) {
    throw new Error("The AES-256 key must be exactly 32 bytes.")
  }

  return new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },

      publicKey,

      asArrayBuffer(rawKey),
    ),
  )
}

export async function encryptAesGcm(
  key: CryptoKey,

  plaintext: Uint8Array,

  method: string,

  requestTarget: string,
): Promise<AesGcmCiphertext> {
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH))

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",

        iv: asArrayBuffer(iv),

        additionalData: asArrayBuffer(
          new TextEncoder().encode(buildAdditionalData(method, requestTarget)),
        ),

        tagLength: AES_TAG_LENGTH,
      },

      key,

      asArrayBuffer(plaintext),
    ),
  )

  return { iv, ciphertext }
}

export async function decryptAesGcm(
  key: CryptoKey,

  encrypted: AesGcmCiphertext,

  method: string,

  requestTarget: string,
): Promise<Uint8Array> {
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",

          iv: asArrayBuffer(encrypted.iv),

          additionalData: asArrayBuffer(
            new TextEncoder().encode(
              buildAdditionalData(method, requestTarget),
            ),
          ),

          tagLength: AES_TAG_LENGTH,
        },

        key,

        asArrayBuffer(encrypted.ciphertext),
      ),
    )
  } catch {
    throw new Error("Transport authentication failed.")
  }
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)

  new Uint8Array(buffer).set(bytes)

  return buffer
}
