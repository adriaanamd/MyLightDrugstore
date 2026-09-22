import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import InventoryPage from "@/pages/inventory/inventory-page"

export const Route = createFileRoute("/inventory/")({
  component: () => (
    <AuthenticatedPage>
      <InventoryPage />
    </AuthenticatedPage>
  ),
})
