import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"

const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])
// Existing UI composites remain intact to preserve the approved presentation.
const defaultLimit = 520

export async function findSourceSizeViolations(
  projectRoot,
  limit = defaultLimit,
) {
  const files = await collectFiles(join(projectRoot, "src"))
  const violations = []

  for (const file of files) {
    const relativeFile = relative(projectRoot, file).split(sep).join("/")
    if (relativeFile.endsWith("/routeTree.gen.ts")) continue

    const lineCount = (await readFile(file, "utf8")).split(/\r?\n/).length - 1
    if (lineCount > limit) violations.push({ file: relativeFile, lineCount })
  }

  return violations
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  )
  const files = []

  for (const entry of entries) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(file)))
    else if (extensions.has(extname(entry.name))) files.push(file)
  }

  return files
}

if (process.argv.includes("--enforce")) {
  const violations = await findSourceSizeViolations(process.cwd())
  if (violations.length > 0) {
    console.error(JSON.stringify(violations, null, 2))
    process.exitCode = 1
  }
}
