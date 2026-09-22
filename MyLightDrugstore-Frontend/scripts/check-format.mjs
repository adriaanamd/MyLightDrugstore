import { spawnSync } from "node:child_process"

const formatTargets = [
  "src/app",
  "src/entities",
  "src/features",
  "src/pages",
  "src/routes",
  "src/shared",
  "src/widgets",
  "src/App.tsx",
  "src/index.css",
  "src/main.tsx",
  "src/router.tsx",
  "src/server.ts",
  "src/vite-env.d.ts",
  "tests",
  "scripts",
  "package.json",
  "README.md",
  "vite.config.ts",
  "vitest.config.ts",
]

const packageManagerCommand =
  process.platform === "win32" ? "corepack.cmd" : "corepack"
const result = spawnSync(
  packageManagerCommand,
  ["pnpm", "exec", "oxfmt", "--check", ...formatTargets],
  { shell: process.platform === "win32", stdio: "inherit" },
)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
