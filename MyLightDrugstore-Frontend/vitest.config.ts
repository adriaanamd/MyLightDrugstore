import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": sourceDirectory,
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
})
