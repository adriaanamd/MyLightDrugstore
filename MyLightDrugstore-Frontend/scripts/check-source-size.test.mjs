import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { findSourceSizeViolations } from "./check-source-size.mjs"

test("reports production files over the configured limit", async () => {
  const root = await mkdtemp(join(tmpdir(), "mylight-size-"))
  await mkdir(join(root, "src/pages"), { recursive: true })
  await writeFile(join(root, "src/pages/large.tsx"), "x\n".repeat(4))

  assert.deepEqual(await findSourceSizeViolations(root, 3), [
    { file: "src/pages/large.tsx", lineCount: 4 },
  ])
})

test("ignores generated route trees", async () => {
  const root = await mkdtemp(join(tmpdir(), "mylight-size-"))
  await mkdir(join(root, "src"), { recursive: true })
  await writeFile(join(root, "src/routeTree.gen.ts"), "x\n".repeat(100))

  assert.deepEqual(await findSourceSizeViolations(root, 3), [])
})
