import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import CatalogPage from "@/pages/catalog/catalog-page"

export const Route = createFileRoute("/catalog/medicines")({
  component: () => (
    <AuthenticatedPage>
      <CatalogPage />
    </AuthenticatedPage>
  ),
})
