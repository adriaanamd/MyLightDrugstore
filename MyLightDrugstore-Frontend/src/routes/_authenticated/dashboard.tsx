import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRoute,
})

function DashboardRoute() {
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Review pharmacy operations at a glance.</p>
    </main>
  )
}
