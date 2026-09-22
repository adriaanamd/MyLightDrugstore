import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const workflowFile = new URL(
  "../../.github/workflows/frontend.yml",
  import.meta.url,
)

test("frontend CI runs all blocking quality gates from the frontend directory", async () => {
  const workflow = await readFile(workflowFile, "utf8")

  assert.match(workflow, /working-directory: MyLightDrugstore-Frontend/)
  assert.match(workflow, /pnpm install --frozen-lockfile/)
  assert.match(workflow, /pnpm run test:architecture/)
  assert.match(workflow, /pnpm run typecheck/)
  assert.match(workflow, /pnpm run format:check/)
  assert.match(workflow, /pnpm run test:unit/)
  assert.match(workflow, /pnpm run build/)
  assert.match(workflow, /timeout-minutes: 10/)
  assert.match(workflow, /permissions:\n  contents: read/)
})
