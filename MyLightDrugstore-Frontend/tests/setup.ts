import { afterEach } from "vitest"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})
