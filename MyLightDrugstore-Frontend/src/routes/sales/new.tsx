import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import SalesNewPage from "@/pages/sales/new-sale-page"

export const Route = createFileRoute("/sales/new")({
  component: () => (
    <AuthenticatedPage>
      <SalesNewPage />
    </AuthenticatedPage>
  ),
})
