import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const pageFiles = [
  "reports/sales-report-page.tsx",
  "reports/inventory-report-page.tsx",
  "security/security-page.tsx",
  "administration/staff-accounts-page.tsx",
  "backups/backups-page.tsx",
]

describe("operations page architecture", () => {
  it("does not depend on the legacy mock API", () => {
    for (const pageFile of pageFiles) {
      const source = readFileSync(
        resolve(process.cwd(), "src/pages", pageFile),
        "utf8",
      )

      expect(source).not.toContain("mockApi")
      expect(source).not.toContain("MockApiError")
    }
  })

  it("uses feature slices for mutations", () => {
    const security = readFileSync(
      resolve(process.cwd(), "src/pages/security/security-page.tsx"),
      "utf8",
    )
    const staff = readFileSync(
      resolve(
        process.cwd(),
        "src/pages/administration/staff-accounts-page.tsx",
      ),
      "utf8",
    )
    const backups = readFileSync(
      resolve(process.cwd(), "src/pages/backups/backups-page.tsx"),
      "utf8",
    )

    expect(security).toContain("useChangePassword")
    expect(staff).toContain("createStaffActions")
    expect(backups).toContain("createBackupManagementActions")
  })
})
