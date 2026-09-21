import type { Backup } from "@/entities/backup"

export function BackupsPage({
  backups,
  onCreate,
  onDownload,
}: {
  backups: Backup[]
  onCreate: () => Promise<void> | void
  onDownload?: (id: string) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <p>Administration</p>
        <h1>Backups</h1>
        <button type="button" onClick={() => void onCreate()}>Request backup</button>
      </header>
      <table>
        <caption>Backup jobs</caption>
        <thead><tr><th>Backup</th><th>Status</th><th /></tr></thead>
        <tbody>
          {backups.map((backup) => (
            <tr key={backup.id}>
              <td>{backup.id}</td>
              <td>{backup.status ?? "pending"}</td>
              <td>
                {onDownload && backup.status === "ready" && (
                  <button type="button" onClick={() => void onDownload(backup.id)}>
                    Download
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
