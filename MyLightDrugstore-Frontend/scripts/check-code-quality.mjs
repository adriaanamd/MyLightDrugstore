import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"

const extensions = new Set([".ts", ".tsx", ".js", ".jsx"])
const forbiddenPatterns = [
  { rule: "explicit-any", pattern: /\bany\b/g },
  { rule: "ts-ignore", pattern: /@ts-ignore\b/g },
  { rule: "ts-expect-error", pattern: /@ts-expect-error\b/g },
  { rule: "non-null-assertion", pattern: /[A-Za-z_$][\w$]*!\s*[.;,)}\]]/g },
  { rule: "legacy-mock-api", pattern: /\b(?:mockApi|MockApiError)\b/g },
  { rule: "legacy-session", pattern: /SessionContext/g },
  { rule: "router-compatibility", pattern: /router-compat/g },
  { rule: "legacy-api-client", pattern: /shared\/api\/client/g },
]

export async function findCodeQualityViolations(projectRoot) {
  const files = await collectFiles(join(projectRoot, "src"))
  const violations = []

  for (const file of files) {
    const relativeFile = relative(projectRoot, file).split(sep).join("/")
    const source = await readFile(file, "utf8")
    const isGeneratedRouteTree = relativeFile.endsWith("/routeTree.gen.ts")

    if (source.includes("@ts-nocheck") && !isGeneratedRouteTree) {
      violations.push({
        file: relativeFile,
        line: lineOf(source, "@ts-nocheck"),
        rule: "ts-nocheck",
      })
    }

    if (isGeneratedRouteTree) continue

    for (const { rule, pattern } of forbiddenPatterns) {
      for (const match of source.matchAll(pattern)) {
        violations.push({
          file: relativeFile,
          line: lineOf(source, match.index ?? 0),
          rule,
        })
      }
    }
  }

  return violations
}

function lineOf(source, offset) {
  return source.slice(0, offset).split(/\r?\n/).length
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
  const violations = await findCodeQualityViolations(process.cwd())
  if (violations.length > 0) {
    console.error(JSON.stringify(violations, null, 2))
    process.exitCode = 1
  }
}
