import { afterEach, describe, expect, it } from "vitest"

import {
  clearCsrfToken,
  ensureCsrfToken,
  getCsrfToken,
  isSafeMethod,
  setCsrfToken,
} from "../../src/shared/api/transport/csrf"

afterEach(() => {
  clearCsrfToken()
})

describe("transport csrf state", () => {
  it("identifies safe methods", () => {
    expect(isSafeMethod("GET")).toBe(true)
    expect(isSafeMethod("head")).toBe(true)
    expect(isSafeMethod("OPTIONS")).toBe(true)
    expect(isSafeMethod("POST")).toBe(false)
  })

  it("shares one in-flight bootstrap and stores the token", async () => {
    let calls = 0
    const fetchCsrf = async (): Promise<string> => {
      calls += 1
      return " csrf-token-1 "
    }

    const tokens = await Promise.all([
      ensureCsrfToken(fetchCsrf),
      ensureCsrfToken(fetchCsrf),
    ])

    expect(calls).toBe(1)
    expect(tokens).toEqual(["csrf-token-1", "csrf-token-1"])
    expect(getCsrfToken()).toBe("csrf-token-1")
    expect(await ensureCsrfToken(fetchCsrf)).toBe("csrf-token-1")
    expect(calls).toBe(1)
  })

  it("rejects blank bootstrap tokens and permits explicit clearing", async () => {
    await expect(ensureCsrfToken(async () => " ")).rejects.toThrow("CSRF token")
    setCsrfToken("token")
    expect(getCsrfToken()).toBe("token")
    clearCsrfToken()
    expect(getCsrfToken()).toBeNull()
  })
})
