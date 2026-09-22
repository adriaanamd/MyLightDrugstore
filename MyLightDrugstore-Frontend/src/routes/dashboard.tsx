import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import DashboardPage from "@/pages/dashboard/dashboard-page"

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AuthenticatedPage>
      <DashboardPage />
    </AuthenticatedPage>
  ),
})
