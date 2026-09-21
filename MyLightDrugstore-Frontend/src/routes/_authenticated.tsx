import { createFileRoute } from "@tanstack/react-router"
import { requireAuthenticated } from "@/app/router/guards"
import { AppShell } from "@/widgets/app-shell"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    await context.session.bootstrap()
    return requireAuthenticated(context)
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <AppShell />
}
