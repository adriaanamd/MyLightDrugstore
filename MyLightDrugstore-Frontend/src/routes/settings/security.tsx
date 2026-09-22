import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import SecurityPage from "@/pages/security/security-page"

export const Route = createFileRoute("/settings/security")({
  component: () => (
    <AuthenticatedPage>
      <SecurityPage />
    </AuthenticatedPage>
  ),
})
