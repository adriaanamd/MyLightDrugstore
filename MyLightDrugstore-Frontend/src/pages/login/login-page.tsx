import type { LoginFormProps } from "@/features/auth/ui/login-form"
import { LoginForm } from "@/features/auth/ui/login-form"

export function LoginPage(props: LoginFormProps) {
  return (
    <main>
      <header>
        <p>MyLightDrugstore</p>
        <h1>Sign in to pharmacy operations</h1>
        <p>Use your staff account to manage catalog, inventory, and sales.</p>
      </header>
      <LoginForm {...props} />
    </main>
  )
}
