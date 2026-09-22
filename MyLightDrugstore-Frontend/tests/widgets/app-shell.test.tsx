import { describe, expect, it } from "vitest"

import { getNavigationForRole } from "../../src/widgets/app-shell/model/navigation"

describe("app shell model", () => {
  it("filters administration navigation for staff", () => {
    const staffPaths = getNavigationForRole("staff")
    const adminPaths = getNavigationForRole("admin")

    expect(staffPaths).not.toContain("/admin/users")
    expect(staffPaths).not.toContain("/backups")
    expect(adminPaths).toContain("/admin/users")
    expect(adminPaths).toContain("/backups")
  })
})
