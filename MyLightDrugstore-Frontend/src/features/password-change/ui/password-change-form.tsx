import { useState, type FormEvent } from "react"
import type { ChangePasswordPayload } from "@/features/auth"

export function PasswordChangeForm({
  onChange,
}: {
  onChange: (payload: ChangePasswordPayload) => Promise<void> | void
}) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!currentPassword) return setError("Current password is required.")
    if (newPassword.length < 6) {
      return setError("New password must be at least 6 characters.")
    }
    if (newPassword !== confirmation) return setError("Passwords do not match.")
    setError(undefined)
    await onChange({ currentPassword, newPassword })
    setCurrentPassword("")
    setNewPassword("")
    setConfirmation("")
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      {error && <p role="alert">{error}</p>}
      <label>
        Current password
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
      <button type="submit">Change password</button>
    </form>
  )
}
