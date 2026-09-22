import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import InventoryAdjustmentsPage from "@/pages/inventory/adjustments-page"

export const Route = createFileRoute("/inventory/adjustments")({
  component: () => (
    <AuthenticatedPage>
      <InventoryAdjustmentsPage />
    </AuthenticatedPage>
  ),
})
