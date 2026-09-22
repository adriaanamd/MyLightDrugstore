import type { ReactNode } from "react"

import {
  useAuthSession,
  type AuthUserProfile,
  type LoginCredentials,
} from "@/features/auth"

type LegacySessionContextValue = {
  user: LegacySessionUser | null

  login(username: string, password: string): Promise<LegacySessionUser>

  logout(): Promise<void>
}

type LegacySessionUser = Omit<AuthUserProfile, "id"> & {
  id: string
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useSession(): LegacySessionContextValue {
  const auth = useAuthSession()

  const login = async (
    username: string,
    password: string,
  ): Promise<LegacySessionUser> => {
    const credentials: LoginCredentials = { username, password }
    return toLegacyUser(await auth.login(credentials))
  }

  return {
    user: auth.user === null ? null : toLegacyUser(auth.user),
    login,
    logout: auth.logout,
  }
}

function toLegacyUser(user: AuthUserProfile): LegacySessionUser {
  return {
    ...user,
    id: String(user.id),
  }
}
