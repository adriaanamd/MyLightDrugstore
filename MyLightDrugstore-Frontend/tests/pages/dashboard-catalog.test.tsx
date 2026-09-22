import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

describe("dashboard and catalog page boundaries", () => {
  it("use entity and feature APIs without the legacy mock client", () => {
    const dashboard = readFileSync(
      "src/pages/dashboard/dashboard-page.tsx",
      "utf8",
    )
    const catalog = readFileSync("src/pages/catalog/catalog-page.tsx", "utf8")

    expect(dashboard).not.toContain("mockApi")
    expect(catalog).not.toContain("mockApi")
    expect(catalog).toContain("createCatalogActions")
    expect(catalog).toContain("createInventoryMutationActions")
  })
})
