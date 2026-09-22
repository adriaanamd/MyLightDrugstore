import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { normalizeApiError } from "@/shared/api"

import {
  createAuthClient,
  type AuthUserProfile,
  type ChangePasswordPayload,
  type LoginCredentials,
} from "../api/auth-client"
import type { AuthStatus } from "./session-types"

type AuthClient = ReturnType<typeof createAuthClient>

type AuthContextValue = {
  user: AuthUserProfile | null

  status: AuthStatus

  login(credentials: LoginCredentials): Promise<AuthUserProfile>

  logout(): Promise<void>

  refresh(): Promise<AuthUserProfile | null>

  changePassword(payload: ChangePasswordPayload): Promise<void>

  clear(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  client,
}: {
  children: ReactNode

  client: AuthClient
}) {
  const [user, setUser] = useState<AuthUserProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const clear = useCallback(() => {
    setUser(null)
    setStatus("anonymous")
  }, [])

  const refresh = useCallback(async (): Promise<AuthUserProfile | null> => {
    try {
      const nextUser = await client.me()
      setUser(nextUser)
      setStatus("authenticated")
      return nextUser
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)

      if (apiError.status === 401) {
        clear()
        return null
      }

      setStatus("anonymous")
      throw apiError
    }
  }, [client, clear])

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUserProfile> => {
      const nextUser = await client.login(credentials)
      setUser(nextUser)
      setStatus("authenticated")
      return nextUser
    },
    [client],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      await client.logout()
    } finally {
      clear()
    }
  }, [client, clear])

  const changePassword = useCallback(
    (payload: ChangePasswordPayload) => client.changePassword(payload),
    [client],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      refresh,
      changePassword,
      clear,
    }),
    [changePassword, clear, login, logout, refresh, status, user],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error("useAuthSession must be used within AuthProvider")
  }

  return context
}
