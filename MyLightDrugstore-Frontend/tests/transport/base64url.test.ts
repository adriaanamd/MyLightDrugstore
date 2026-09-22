import { describe, expect, it } from "vitest"

import {
  decodeBase64Url,
  encodeBase64Url,
} from "../../src/shared/api/transport/base64url"
import {
  TRANSPORT_ALGORITHM,
  TRANSPORT_VERSION,
} from "../../src/shared/api/transport/types"

describe("transport base64url primitives", () => {
  it("exposes the Laravel transport version and algorithm", () => {
    expect(TRANSPORT_VERSION).toBe(1)
    expect(TRANSPORT_ALGORITHM).toBe("A256GCM")
  })

  it("round trips binary bytes without padding", () => {
    const input = Uint8Array.from([0, 1, 2, 250, 251, 252, 255])
    const encoded = encodeBase64Url(input)

    expect(encoded).toBe("AAEC-vv8_w")
    expect(decodeBase64Url(encoded)).toEqual(input)
  })

  it.each(["A", "AA=", "AA+", "AA/", "AA=="]) (
    "rejects non-canonical value %s",
    (value) => {
      expect(() => decodeBase64Url(value)).toThrow(
        "canonical base64url",
      )
    },
  )
})
