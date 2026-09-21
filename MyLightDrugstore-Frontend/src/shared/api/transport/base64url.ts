const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]*$/

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

export function decodeBase64Url(value: string): Uint8Array {
  if (!BASE64_URL_PATTERN.test(value) || value.length % 4 === 1) {
    throw new Error("The value is not canonical base64url.")
  }

  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  if (encodeBase64Url(bytes) !== value) {
    throw new Error("The value is not canonical base64url.")
  }

  return bytes
}
