import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const packageFile = new URL("../package.json", import.meta.url)

test("frontend exposes the required quality scripts", async () => {
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"))
  const scripts = packageJson.scripts ?? {}

  assert.equal(scripts.typecheck, "tsc --noEmit")
  assert.equal(scripts["format:check"], "oxfmt --check .")
  assert.equal(scripts["test:unit"], "vitest run")
  assert.equal(
    scripts["test:architecture"],
    "node scripts/check-fsd-boundaries.mjs --enforce && node scripts/check-source-size.mjs --enforce",
  )
  assert.equal(
    scripts.test,
    "pnpm run test:unit && pnpm run test:architecture && pnpm run typecheck && pnpm run build",
  )
})
