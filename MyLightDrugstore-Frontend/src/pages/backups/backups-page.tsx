import { useEffect, useMemo, useState } from "react"

import { createBackupApi, type BackupJob } from "@/entities/backup"
import { useAuthSession } from "@/features/auth"
import { createBackupManagementActions } from "@/features/backup-management"
import { normalizeApiError } from "@/shared/api"
import { apiClient } from "@/shared/api/api-client"
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  formatDateTime,
  PageHeader,
  showToast,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui"

const backupApi = createBackupApi(apiClient.transport)

function jobBadge(status: BackupJob["status"]) {
  if (status === "completed") return <Badge variant="green">Completed</Badge>
  if (status === "failed") return <Badge variant="red">Failed</Badge>
  return <Badge variant="amber">Queued</Badge>
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function BackupsPage() {
  const { user } = useAuthSession()
  const actions = useMemo(
    () => createBackupManagementActions(backupApi, user?.role ?? "staff"),
    [user?.role],
  )
  const [jobs, setJobs] = useState<BackupJob[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const load = async () => {
    try {
      const currentJobs = actions.jobs()
      await Promise.all(currentJobs.map((job) => actions.status(job.id)))
    } catch {
      // Keep the latest browser-session job state when polling fails.
    } finally {
      setJobs(actions.jobs())
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const intervalId = setInterval(() => void load(), 3000)
    return () => clearInterval(intervalId)
  }, [actions])

  const handleRequest = async () => {
    setRequesting(true)
    try {
      const job = await actions.request()
      showToast(`Backup job ${job.id} queued.`)
      setConfirmOpen(false)
      setJobs(actions.jobs())
    } catch (cause: unknown) {
      showToast(normalizeApiError(cause).message, "error")
    } finally {
      setRequesting(false)
    }
  }

  const handleDownload = async (job: BackupJob) => {
    if (job.status !== "completed") return

    try {
      await actions.download(job.id, saveBlob)
      showToast("Backup downloaded.", "info")
    } catch (cause: unknown) {
      showToast(normalizeApiError(cause).message, "error")
    }
  }

  return (
    <div>
      <PageHeader
        title="Backup Jobs"
        subtitle="Request and monitor database backup jobs"
        action={
          <Button onClick={() => setConfirmOpen(true)}>Request Backup</Button>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 flex items-start gap-2 text-sm text-amber-800">
        <span>⚠</span>
        <div>
          <strong>Demo notice:</strong> Backup jobs are tracked in this browser
          session until the backend provides a list endpoint.
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Job ID</Th>
              <Th>Requested By</Th>
              <Th>Created</Th>
              <Th>Completed</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  No backup jobs yet.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <Tr key={job.id}>
                <Td>
                  <span className="font-mono text-xs text-slate-400">
                    {job.id}
                  </span>
                </Td>
                <Td className="text-slate-600">{user?.fullName ?? "—"}</Td>
                <Td className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDateTime(job.requestedAt)}
                </Td>
                <Td className="text-xs text-slate-500 whitespace-nowrap">
                  {job.completedAt ? formatDateTime(job.completedAt) : "—"}
                </Td>
                <Td>{jobBadge(job.status)}</Td>
                <td className="px-3 py-2.5 text-slate-700 border-b border-slate-100 text-xs text-slate-500 max-w-xs truncate">
                  {job.size === null ? "—" : `${job.size} bytes`}
                </td>
                <Td>
                  {job.status === "completed" && (
                    <button
                      onClick={() => void handleDownload(job)}
                      className="text-xs text-teal-600 hover:underline font-medium"
                    >
                      ↓ Download
                    </button>
                  )}
                  {job.status === "queued" && (
                    <span className="text-xs text-slate-400 animate-pulse">
                      Processing…
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRequest}
        title="Request Backup"
        message="Queue a new backup job? The job runs asynchronously and should complete within 30 seconds."
        confirmLabel="Request Backup"
        variant="primary"
        loading={requesting}
      />
    </div>
  )
}
