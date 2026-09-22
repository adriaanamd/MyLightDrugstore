export type BackupStatus = "queued" | "completed" | "failed"

export type BackupJob = {
  id: number

  status: BackupStatus

  requestedAt: string

  completedAt: string | null

  size: number | null
}

export type Backup = BackupJob
