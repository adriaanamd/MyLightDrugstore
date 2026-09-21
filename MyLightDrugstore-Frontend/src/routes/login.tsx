import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/login")({
  component: LoginRoute,
})

function LoginRoute() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>Access the MyLightDrugstore operations workspace.</p>
    </main>
  )
}
