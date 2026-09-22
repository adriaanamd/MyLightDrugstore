import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sourceRoot = resolve(process.cwd(), "src/pages/sales")

describe("sales page architecture", () => {
  it("uses entity and feature APIs instead of the legacy mock client", () => {
    const pageFiles = [
      "new-sale-page.tsx",
      "cart-page.tsx",
      "sales-list-page.tsx",
      "sales-print-page.tsx",
    ]

    for (const pageFile of pageFiles) {
      const source = readFileSync(resolve(sourceRoot, pageFile), "utf8")

      expect(source).not.toContain("mockApi")
      expect(source).not.toContain("MockApiError")
    }
  })

  it("keeps sales actions behind feature slices", () => {
    const newSale = readFileSync(
      resolve(sourceRoot, "new-sale-page.tsx"),
      "utf8",
    )
    const cart = readFileSync(resolve(sourceRoot, "cart-page.tsx"), "utf8")

    expect(newSale).toContain("createSalesEntryActions")
    expect(cart).toContain("createSalesCartActions")
  })
})
