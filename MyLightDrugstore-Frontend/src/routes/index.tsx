import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
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
