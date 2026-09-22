import { ApiError } from "@/shared/api"
import { createBackupApi, type BackupJob } from "@/entities/backup"
import type { UserRole } from "@/entities/user"
import { apiClient } from "@/shared/api/api-client"

export type BackupManagementApi = ReturnType<typeof createBackupApi>

export type SaveBackupBlob = (blob: Blob, filename: string) => void

const backupApi = createBackupApi(apiClient.transport)

export function createBackupManagementActions(
  api: BackupManagementApi,
  role: UserRole,
) {
  const jobs: BackupJob[] = []

  return {
    async request(): Promise<BackupJob> {
      const job = await api.create()
      replaceJob(jobs, job)
      return job
    },

    async status(id: number): Promise<BackupJob> {
      assertAdmin(role)
      const job = await api.show(id)
      replaceJob(jobs, job)
      return job
    },

    async download(id: number, save: SaveBackupBlob): Promise<void> {
      assertAdmin(role)
      const bytes = await api.download(id)
      const arrayBuffer = new ArrayBuffer(bytes.byteLength)
      new Uint8Array(arrayBuffer).set(bytes)
      const blob = new Blob([arrayBuffer], {
        type: "application/octet-stream",
      })
      save(blob, `mld_backup_${id}.bin`)
    },

    jobs(): BackupJob[] {
      return [...jobs]
    },
  }
}

export function createDefaultBackupManagementActions(role: UserRole) {
  return createBackupManagementActions(backupApi, role)
}

function replaceJob(jobs: BackupJob[], nextJob: BackupJob): void {
  const index = jobs.findIndex((job) => job.id === nextJob.id)

  if (index === -1) {
    jobs.push(nextJob)
    return
  }

  jobs[index] = nextJob
}

function assertAdmin(role: UserRole): void {
  if (role !== "admin") {
    throw new ApiError("Administrator access is required.", 403, "forbidden")
  }
}
