import React, { createContext, useContext, useState, useCallback } from "react"
import type { User } from "./api/types"
import { mockApi } from "./api/client"

interface SessionContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    const u = await mockApi.login(username, password)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await mockApi.logout()
    setUser(null)
  }, [])

  return (
    <SessionContext.Provider value={{ user, login, logout }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within SessionProvider")
  return ctx
}
