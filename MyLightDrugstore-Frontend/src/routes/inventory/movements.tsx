import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import InventoryMovementsPage from "@/pages/inventory/movements-page"

export const Route = createFileRoute("/inventory/movements")({
  component: () => (
    <AuthenticatedPage>
      <InventoryMovementsPage />
    </AuthenticatedPage>
  ),
})
