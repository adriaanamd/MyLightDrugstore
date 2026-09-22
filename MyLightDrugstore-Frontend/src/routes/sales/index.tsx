import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import SalesListPage from "@/pages/sales/sales-list-page"

export const Route = createFileRoute("/sales/")({
  component: () => (
    <AuthenticatedPage>
      <SalesListPage />
    </AuthenticatedPage>
  ),
})
