import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { createBackupApi } from "@/entities/backup"
import { createBackupManager } from "@/features/backup-management"
import { getAppServices } from "@/app/providers/app-services"
import { BackupsPage } from "@/pages/backups/backups-page"

const backupApi = createBackupApi(getAppServices().transport)
const backups = createBackupManager({
  create: backupApi.create,
  show: backupApi.show,
  download: (id) => backupApi.download(String(id)),
})

export const Route = createFileRoute("/_authenticated/backups")({
  beforeLoad: ({ context }) => {
    if (context.session.getSnapshot().user?.role !== "admin") {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: () => [],
  component: BackupsRoute,
})

function BackupsRoute() {
  const router = useRouter()
  return (
    <BackupsPage
      backups={Route.useLoaderData()}
      onCreate={async () => {
        await backups.create()
        await router.invalidate()
      }}
      onDownload={async (id) => {
        const bytes = await backups.download(Number(id))
        const url = URL.createObjectURL(
          new Blob([bytes.slice().buffer as ArrayBuffer]),
        )
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `backup-${id}.bin`
        anchor.click()
        URL.revokeObjectURL(url)
      }}
    />
  )
}
