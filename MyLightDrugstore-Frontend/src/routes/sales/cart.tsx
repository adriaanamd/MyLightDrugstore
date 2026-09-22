import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import SalesCartPage from "@/pages/sales/cart-page"

export const Route = createFileRoute("/sales/cart")({
  component: () => (
    <AuthenticatedPage>
      <SalesCartPage />
    </AuthenticatedPage>
  ),
})
