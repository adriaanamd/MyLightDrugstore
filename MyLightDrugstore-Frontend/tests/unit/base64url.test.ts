import assert from "node:assert/strict"
import { test } from "node:test"
import {
  decodeBase64Url,
  encodeBase64Url,
} from "@/shared/api/transport/base64url"

test("base64url encoding is canonical and padding-free", () => {
  assert.equal(encodeBase64Url(new Uint8Array([0, 1, 2, 250, 255])), "AAEC-v8")
})

test("base64url decoding round-trips arbitrary bytes", () => {
  assert.deepEqual(
    decodeBase64Url("AAEC-v8"),
    new Uint8Array([0, 1, 2, 250, 255]),
  )
})

test("base64url decoding rejects non-canonical values", () => {
  for (const value of ["AAEC+v8", "AAEC-v8=", "A", "AA EC-v8"]) {
    assert.throws(() => decodeBase64Url(value), /base64url/i)
  }
})
