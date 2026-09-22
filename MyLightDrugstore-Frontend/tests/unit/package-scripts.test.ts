import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

type PackageManifest = {
  scripts?: Record<string, string>
}

const packagePath = fileURLToPath(
  new URL("../../package.json", import.meta.url),
)

describe("frontend quality scripts", () => {
  it("defines the strict verification commands", async () => {
    const manifest = JSON.parse(
      await readFile(packagePath, "utf8"),
    ) as PackageManifest
    const scripts = manifest.scripts ?? {}

    expect(scripts.typecheck).toBe("tsc --noEmit")
    expect(scripts["format:check"]).toBe("node scripts/check-format.mjs")
    expect(scripts["test:unit"]).toBe("vitest run")
    expect(scripts["test:architecture"]).toBe(
      "node scripts/check-fsd-boundaries.mjs --enforce && node scripts/check-source-size.mjs --enforce && node scripts/check-code-quality.mjs --enforce",
    )
  })
})
