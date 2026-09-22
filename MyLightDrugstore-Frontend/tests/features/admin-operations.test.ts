import { describe, expect, it, vi } from "vitest"

import { validatePasswordChange } from "../../src/features/password-change/model/forms"
import {
  createStaffActions,
  type StaffApi,
} from "../../src/features/staff-management/api/mutations"
import { validateStaffCreateForm } from "../../src/features/staff-management/model/forms"
import {
  createBackupManagementActions,
  type BackupManagementApi,
} from "../../src/features/backup-management/api/mutations"

describe("admin operation features", () => {
  it("validates the backend password policy", () => {
    expect(
      validatePasswordChange({
        currentPassword: "old",
        newPassword: "short",
        confirmPassword: "short",
      }).valid,
    ).toBe(false)
    expect(
      validatePasswordChange({
        currentPassword: "old-password",
        newPassword: "a-secure-password",
        confirmPassword: "a-secure-password",
      }).valid,
    ).toBe(true)
  })

  it("guards staff mutations to administrators", async () => {
    const api: StaffApi = {
      list: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 7 }),
      show: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 7 }),
    }

    expect(
      validateStaffCreateForm({
        username: "ab",
        fullName: "",
        password: "short",
        role: "staff",
      }).valid,
    ).toBe(false)

    const staffActions = createStaffActions(api, "staff")
    await expect(
      staffActions.create({
        username: "ada",
        fullName: "Ada Staff",
        password: "a-secure-password",
        role: "staff",
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" })

    const adminActions = createStaffActions(api, "admin")
    await adminActions.deactivate(7)
    expect(api.update).toHaveBeenCalledWith(7, { active: false })
  })

  it("tracks requested jobs in memory and downloads bytes as a blob", async () => {
    const api: BackupManagementApi = {
      create: vi.fn().mockResolvedValue({
        id: 77,
        status: "queued",
        requestedAt: "2026-09-18T02:00:00Z",
        completedAt: null,
        size: null,
      }),
      show: vi.fn().mockResolvedValue({
        id: 77,
        status: "completed",
        requestedAt: "2026-09-18T02:00:00Z",
        completedAt: "2026-09-18T02:01:00Z",
        size: 3,
      }),
      download: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }
    const save = vi.fn()
    const actions = createBackupManagementActions(api, "admin")

    await expect(actions.request()).resolves.toMatchObject({ id: 77 })
    await expect(actions.status(77)).resolves.toMatchObject({
      status: "completed",
    })
    await actions.download(77, save)

    expect(actions.jobs()).toHaveLength(1)
    expect(save).toHaveBeenCalledWith(expect.any(Blob), "mld_backup_77.bin")
  })
})
