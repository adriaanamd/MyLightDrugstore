import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { findCodeQualityViolations } from "./check-code-quality.mjs"

test("reports strict-code and legacy violations", async () => {
  const root = await mkdtemp(join(tmpdir(), "mylight-quality-"))
  await mkdir(join(root, "src"), { recursive: true })
  await writeFile(
    join(root, "src/bad.ts"),
    "const value: any = thing!.value // @ts-ignore\nimport { mockApi } from 'shared/api/client'\n",
  )

  assert.deepEqual(await findCodeQualityViolations(root), [
    { file: "src/bad.ts", line: 1, rule: "explicit-any" },
    { file: "src/bad.ts", line: 1, rule: "ts-ignore" },
    { file: "src/bad.ts", line: 1, rule: "non-null-assertion" },
    { file: "src/bad.ts", line: 2, rule: "legacy-mock-api" },
    { file: "src/bad.ts", line: 2, rule: "legacy-api-client" },
  ])
})

test("allows generated route metadata to contain generator assertions", async () => {
  const root = await mkdtemp(join(tmpdir(), "mylight-quality-"))
  await mkdir(join(root, "src"), { recursive: true })
  await writeFile(
    join(root, "src/routeTree.gen.ts"),
    "// @ts-nocheck\nconst route = value as any\n",
  )

  assert.deepEqual(await findCodeQualityViolations(root), [])
})
