import type { TransportCiphertext } from "./types"

const AES_KEY_LENGTH = 32
const AES_IV_LENGTH = 12
const AES_TAG_LENGTH = 128

export async function generateAes256Key(): Promise<{
  aesKey: CryptoKey
  rawKey: Uint8Array
}> {
  const rawKey = crypto.getRandomValues(new Uint8Array(AES_KEY_LENGTH))
  const aesKey = await crypto.subtle.importKey(
    "raw",
    asArrayBuffer(rawKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )

  return { aesKey, rawKey }
}

export async function importRsaOaepPublicKey(
  publicKeyPem: string,
): Promise<CryptoKey> {
  const normalizedPem = publicKeyPem.replace(/\\n/g, "\n")
  const encodedKey = normalizedPem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "")

  if (encodedKey === "") {
    throw new Error("The transport public key is empty.")
  }

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
  additionalData: Uint8Array,
): Promise<TransportCiphertext> {
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: asArrayBuffer(iv),
        additionalData: asArrayBuffer(additionalData),
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
  encrypted: TransportCiphertext,
  additionalData: Uint8Array,
): Promise<Uint8Array> {
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: asArrayBuffer(encrypted.iv),
          additionalData: asArrayBuffer(additionalData),
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
