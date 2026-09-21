import { createFileRoute } from "@tanstack/react-router"
import { requireAuthenticated } from "@/app/router/guards"
import { getAppServices } from "@/app/providers/app-services"
import { AppShell } from "@/widgets/app-shell"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    await context.session.bootstrap()
    return requireAuthenticated(context)
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const services = getAppServices()
  return (
    <AppShell
      getServerTime={async () =>
        (await services.transport.request<{ utc: string }>("/system/time")).data
          .utc
      }
      onLogout={services.session.logout}
    />
  )
}
