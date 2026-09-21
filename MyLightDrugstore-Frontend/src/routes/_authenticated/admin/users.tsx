import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { createUserApi } from "@/entities/user"
import { createStaffManager } from "@/features/staff-management"
import { getAppServices } from "@/app/providers/app-services"
import { AdminUsersPage } from "@/pages/admin/users-page"

const staff = createStaffManager(createUserApi(getAppServices().transport))

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ context }) => {
    if (context.session.getSnapshot().user?.role !== "admin") {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => (await staff.list()).data,
  component: AdminUsersRoute,
})

function AdminUsersRoute() {
  const router = useRouter()
  const user = getAppServices().session.getSnapshot().user
  return (
    <AdminUsersPage
      role={user?.role}
      users={Route.useLoaderData()}
      onDeactivate={async (id) => {
        await staff.deactivate(id)
        await router.invalidate()
      }}
    />
  )
}
