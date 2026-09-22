import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import SalesPrintPage from "@/pages/sales/sales-print-page"

export const Route = createFileRoute("/sales/print/$saleId")({
  component: () => (
    <AuthenticatedPage shell={false}>
      <SalesPrintPage />
    </AuthenticatedPage>
  ),
})
