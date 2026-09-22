import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

describe("login page contract", () => {
  it("keeps the current login labels and demo actions", () => {
    const source = readFileSync("src/pages/login/login-page.tsx", "utf8")

    expect(source).toContain("Sign in to your account")
    expect(source).toContain("Admin demo")
    expect(source).toContain("Staff demo")
    expect(source).toContain("useAuthSession")
    expect(source).not.toContain("mockApi")
  })
})
