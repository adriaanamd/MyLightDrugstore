import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useSessionStore } from "@/features/auth/model/context"
import { LoginPage } from "@/pages/login/login-page"

export const Route = createFileRoute("/login")({
  component: LoginRoute,
})

function LoginRoute() {
  const session = useSessionStore()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()

  return (
    <LoginPage
      errorMessage={errorMessage}
      onSubmit={async (credentials) => {
        try {
          setErrorMessage(undefined)
          await session.login(credentials)
          await navigate({ to: "/dashboard" })
        } catch {
          setErrorMessage("The username or password is incorrect.")
        }
      }}
    />
  )
}
