import { describe, expect, it, vi } from "vitest"

import {
  createBackupManagementActions,
  type BackupManagementApi,
} from "../../src/features/backup-management"
import {
  createStaffActions,
  type StaffApi,
} from "../../src/features/staff-management"

describe("admin and report workflow behavior", () => {
  it("denies staff mutation access and allows admin deactivation", async () => {
    const api: StaffApi = {
      list: vi.fn(),
      create: vi.fn(),
      show: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 7 }),
    }

    await expect(
      createStaffActions(api, "staff").create({
        username: "ada",
        fullName: "Ada Staff",
        password: "a-secure-password",
        role: "staff",
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" })

    await createStaffActions(api, "admin").deactivate(7)
    expect(api.update).toHaveBeenCalledWith(7, { active: false })
  })

  it("passes completed backup bytes to the download boundary", async () => {
    const api: BackupManagementApi = {
      create: vi.fn(),
      show: vi.fn(),
      download: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }
    const save = vi.fn()
    const actions = createBackupManagementActions(api, "admin")

    await actions.download(77, save)

    expect(save).toHaveBeenCalledWith(expect.any(Blob), "mld_backup_77.bin")
  })
})
