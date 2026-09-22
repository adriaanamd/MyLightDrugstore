import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("API architecture", () => {
  it("does not retain the monolithic legacy API modules", () => {
    const sourceRoot = resolve(process.cwd(), "src/shared/api")

    expect(existsSync(resolve(sourceRoot, "client.ts"))).toBe(false)
    expect(existsSync(resolve(sourceRoot, "types.ts"))).toBe(false)
  })
})
