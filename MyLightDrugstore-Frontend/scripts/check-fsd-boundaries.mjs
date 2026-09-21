import { readdir, readFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"

export const layerOrder = ["shared", "entities", "features", "widgets", "pages", "app"]
const productionExtensions = new Set([".ts", ".tsx", ".js", ".jsx"])
const allowedRootFiles = new Set([
  "client.tsx",
  "server.ts",
  "router.tsx",
  "routeTree.gen.ts",
  "vite-env.d.ts",
  "index.css",
])

export async function findViolations(projectRoot) {
  const sourceRoot = join(projectRoot, "src")
  const files = await collectFiles(sourceRoot)
  const violations = []

  for (const file of files) {
    const rel = relative(projectRoot, file).split(sep).join("/")
    const sourceRel = relative(sourceRoot, file).split(sep).join("/")
    if (!sourceRel.includes("/") && !allowedRootFiles.has(sourceRel)) {
      violations.push({ file: rel, rule: "legacy-root-file" })
    }

    const importerLayer = layerFor(sourceRel)
    if (!importerLayer) continue
    const source = await readFile(file, "utf8")
    for (const importPath of importsFrom(source)) {
      const target = aliasTarget(importPath)
      if (!target) continue
      const targetLayer = layerFor(target)
      if (!targetLayer) continue
      if (layerOrder.indexOf(targetLayer) > layerOrder.indexOf(importerLayer)) {
        violations.push({ file: rel, importPath, rule: "upward-layer-import" })
        continue
      }
      if (
        targetLayer === importerLayer &&
        isDeepCrossSliceImport(importerLayer, sourceRel, target)
      ) {
        violations.push({ file: rel, importPath, rule: "deep-cross-slice-import" })
      }
    }
  }

  return violations
}

function layerFor(sourceRel) {
  const match = sourceRel.match(/^(shared|entities|features|widgets|pages|app)(?:\/|$)/)
  return match?.[1]
}

function aliasTarget(importPath) {
  return importPath.startsWith("@/") ? importPath.slice(2) : undefined
}

function isDeepCrossSliceImport(layer, importer, target) {
  if (layer === "shared" || layer === "app") return false
  const importerSlice = importer.split("/")[1]
  const targetParts = target.split("/")
  return targetParts[1] !== importerSlice && targetParts.length > 2
}

function importsFrom(source) {
  return [...source.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  )
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(path)))
    else if (productionExtensions.has(extensionOf(entry.name))) files.push(path)
  }
  return files
}

function extensionOf(file) {
  const index = file.lastIndexOf(".")
  return index === -1 ? "" : file.slice(index)
}

if (process.argv.includes("--enforce")) {
  const violations = await findViolations(process.cwd())
  if (violations.length > 0) {
    console.error(JSON.stringify(violations, null, 2))
    process.exitCode = 1
  }
}
