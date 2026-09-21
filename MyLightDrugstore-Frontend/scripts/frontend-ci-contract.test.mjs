import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { test } from "node:test"

test("frontend CI preserves the required quality gates", async () => {
  const workflow = await readFile(
    join(process.cwd(), "..", ".github", "workflows", "frontend.yml"),
    "utf8",
  )

  for (const command of [
    "pnpm install --frozen-lockfile",
    "pnpm run test:architecture",
    "pnpm run typecheck",
    "pnpm run format:check",
    "pnpm run test:unit",
    "pnpm run build",
  ]) {
    assert.ok(workflow.includes(command), `missing CI command: ${command}`)
  }

  const timeout = Number(workflow.match(/timeout-minutes:\s*(\d+)/)?.[1])
  assert.ok(Number.isFinite(timeout) && timeout > 0 && timeout <= 10)
})
