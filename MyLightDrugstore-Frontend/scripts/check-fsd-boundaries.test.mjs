import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { findViolations } from "./check-fsd-boundaries.mjs"

async function fixtureRoot() {
  return mkdtemp(join(tmpdir(), "mylight-fsd-"))
}

test("rejects a feature importing a widget implementation", async () => {
  const root = await fixtureRoot()
  await mkdir(join(root, "src/features/auth/model"), { recursive: true })
  await writeFile(
    join(root, "src/features/auth/model/login.ts"),
    'import x from "@/widgets/app-shell/app-shell"',
  )

  assert.deepEqual(await findViolations(root), [
    {
      file: "src/features/auth/model/login.ts",
      importPath: "@/widgets/app-shell/app-shell",
      rule: "upward-layer-import",
    },
  ])
})

test("allows a page importing a feature public barrel", async () => {
  const root = await fixtureRoot()
  await mkdir(join(root, "src/pages/login"), { recursive: true })
  await writeFile(
    join(root, "src/pages/login/login-page.tsx"),
    'import { useLogin } from "@/features/auth"',
  )

  assert.deepEqual(await findViolations(root), [])
})
