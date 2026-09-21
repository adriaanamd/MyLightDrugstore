import type { ChangePasswordPayload } from "@/features/auth"
import { PasswordChangeForm } from "@/features/password-change"

export function SecurityPage({
  onChange,
}: {
  onChange: (payload: ChangePasswordPayload) => Promise<void> | void
}) {
  return (
    <main>
      <header>
        <p>Account</p>
        <h1>Change password</h1>
      </header>
      <PasswordChangeForm onChange={onChange} />
    </main>
  )
}
