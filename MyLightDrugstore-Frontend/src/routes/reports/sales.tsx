import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import ReportsSalesPage from "@/pages/reports/sales-report-page"

export const Route = createFileRoute("/reports/sales")({
  component: () => (
    <AuthenticatedPage>
      <ReportsSalesPage />
    </AuthenticatedPage>
  ),
})
