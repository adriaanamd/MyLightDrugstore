import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import BackupsPage from "@/pages/backups/backups-page"

export const Route = createFileRoute("/backups")({
  component: () => (
    <AuthenticatedPage adminOnly>
      <BackupsPage />
    </AuthenticatedPage>
  ),
})
