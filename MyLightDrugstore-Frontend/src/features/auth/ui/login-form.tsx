import type { FormEvent } from "react"
import { useState } from "react"
import type { LoginCredentials } from "../api/auth-client"

export type LoginFormProps = {
  onSubmit: (credentials: LoginCredentials) => Promise<void> | void
  errorMessage?: string
}

export function LoginForm({ onSubmit, errorMessage }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const credentials = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    }

    setIsSubmitting(true)
    try {
      await onSubmit(credentials)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username">Username</label>
      <input id="username" name="username" autoComplete="username" required />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
