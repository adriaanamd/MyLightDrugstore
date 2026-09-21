import { createFileRoute } from "@tanstack/react-router"
import { redirectHome } from "@/app/router/guards"

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => redirectHome(context),
  component: HomeRoute,
})

function HomeRoute() {
  return (
    <main>
      <h1>MyLightDrugstore</h1>
      <p>Pharmacy operations workspace.</p>
    </main>
  )
}
