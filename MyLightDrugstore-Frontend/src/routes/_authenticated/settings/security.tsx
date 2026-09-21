import { createFileRoute, useRouter } from "@tanstack/react-router"
import { createPasswordChange } from "@/features/password-change"
import { getAppServices } from "@/app/providers/app-services"
import { SecurityPage } from "@/pages/security/security-page"

const passwordChange = createPasswordChange(getAppServices().auth)

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: SecurityRoute,
})

function SecurityRoute() {
  const router = useRouter()
  return (
    <SecurityPage
      onChange={async (payload) => {
        await passwordChange.submit(payload)
        await router.invalidate()
      }}
    />
  )
}
