import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("router architecture", () => {
  it("does not retain the temporary router compatibility module", () => {
    expect(
      existsSync(resolve(process.cwd(), "src/shared/router-compat.tsx")),
    ).toBe(false)
  })

  it("uses the router package directly in application source", () => {
    const sourceRoot = resolve(process.cwd(), "src")
    const routeSource = readFileSync(
      resolve(sourceRoot, "routes/$.tsx"),
      "utf8",
    )

    expect(routeSource).toContain("@tanstack/react-router")
    expect(routeSource).not.toContain("router-compat")
  })
})
