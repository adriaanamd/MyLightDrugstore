// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AdminUsersPage } from "@/pages/admin/users-page"
import { BackupsPage } from "@/pages/backups/backups-page"
import { createBackupManager } from "@/features/backup-management"

describe("admin, security, and backup workflows", () => {
  it("does not render admin content for staff users", () => {
    render(<AdminUsersPage role="staff" users={[]} onDeactivate={vi.fn()} />)

    expect(screen.queryByText("Staff Accounts")).toBeNull()
    expect(screen.getByText("Admin access required")).not.toBeNull()
  })

  it("downloads backup bytes through the encrypted transport adapter", async () => {
    const binaryPath: string[] = []
    const manager = createBackupManager({
      download: async (id: number) => {
        binaryPath.push(`/api/v1/backups/${id}/download`)
        return new Uint8Array([1, 2, 3])
      },
    })

    const bytes = await manager.download(12)

    expect(binaryPath).toEqual(["/api/v1/backups/12/download"])
    expect(bytes).toEqual(new Uint8Array([1, 2, 3]))
  })

  it("renders backup status and management actions", () => {
    render(<BackupsPage backups={[{ id: "backup-1", status: "ready" }]} onCreate={vi.fn()} />)

    expect(screen.getByText("backup-1")).not.toBeNull()
    expect(screen.getByText("ready")).not.toBeNull()
  })
})
