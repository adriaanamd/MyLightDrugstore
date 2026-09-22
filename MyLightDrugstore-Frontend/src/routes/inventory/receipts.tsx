import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import InventoryReceiptsPage from "@/pages/inventory/receipts-page"

export const Route = createFileRoute("/inventory/receipts")({
  component: () => (
    <AuthenticatedPage>
      <InventoryReceiptsPage />
    </AuthenticatedPage>
  ),
})
