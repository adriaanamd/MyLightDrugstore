import type { AuthUserProfile } from "../api/auth-client"

export type AuthSession = {
  user: AuthUserProfile
}

export type AuthStatus = "loading" | "authenticated" | "anonymous"
