import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

describe("inventory page boundaries", () => {
  it("use inventory entities and feature mutations", () => {
    for (const file of [
      "inventory-page.tsx",
      "receipts-page.tsx",
      "adjustments-page.tsx",
      "movements-page.tsx",
    ]) {
      const source = readFileSync(`src/pages/inventory/${file}`, "utf8")
      expect(source).not.toContain("mockApi")
      expect(source).not.toContain("MockApiError")
    }

    expect(
      readFileSync("src/pages/inventory/receipts-page.tsx", "utf8"),
    ).toContain("inventoryActions.receive")
    expect(
      readFileSync("src/pages/inventory/adjustments-page.tsx", "utf8"),
    ).toContain("inventoryActions.adjust")
  })
})
