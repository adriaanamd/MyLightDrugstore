import assert from "node:assert/strict"
import { test } from "node:test"
import { readRuntimeEnv } from "@/shared/config/env"

test("runtime environment defaults to the Laravel API prefix", () => {
  assert.deepEqual(readRuntimeEnv({}), { apiBaseUrl: "/api/v1" })
})

test("runtime environment accepts an explicit API base URL", () => {
  assert.deepEqual(
    readRuntimeEnv({ VITE_API_BASE_URL: "https://api.example.test/api/v1" }),
    { apiBaseUrl: "https://api.example.test/api/v1" },
  )
})

test("runtime environment rejects an empty explicit API base URL", () => {
  assert.throws(
    () => readRuntimeEnv({ VITE_API_BASE_URL: "   " }),
    /API base URL/i,
  )
})
