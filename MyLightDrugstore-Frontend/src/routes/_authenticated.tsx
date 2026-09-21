import { Outlet, createFileRoute } from "@tanstack/react-router"
import { requireAuthenticated } from "@/app/router/guards"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => requireAuthenticated(context),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
