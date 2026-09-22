import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import ReportsInventoryPage from "@/pages/reports/inventory-report-page"

export const Route = createFileRoute("/reports/inventory")({
  component: () => (
    <AuthenticatedPage>
      <ReportsInventoryPage />
    </AuthenticatedPage>
  ),
})
