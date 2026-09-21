import { createContext, useContext, type PropsWithChildren } from "react"
import type { SessionStore } from "./types"

const SessionStoreContext = createContext<SessionStore | null>(null)

export function SessionStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: SessionStore }>) {
  return (
    <SessionStoreContext.Provider value={store}>
      {children}
    </SessionStoreContext.Provider>
  )
}

export function useSessionStore(): SessionStore {
  const store = useContext(SessionStoreContext)
  if (!store) {
    throw new Error("useSessionStore must be used within SessionStoreProvider.")
  }
  return store
}
