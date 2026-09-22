import { createFileRoute } from "@tanstack/react-router"

import { AuthenticatedPage } from "@/app/router/authenticated-page"
import AdminUsersPage from "@/pages/administration/staff-accounts-page"

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <AuthenticatedPage adminOnly>
      <AdminUsersPage />
    </AuthenticatedPage>
  ),
})
