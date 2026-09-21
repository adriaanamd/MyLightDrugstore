import type { LoginCredentials } from "../api/auth-client"
import type { AuthSessionClient, SessionSnapshot } from "./types"

export function createSessionStore(client: AuthSessionClient) {
  let snapshot: SessionSnapshot = { status: "unknown", user: null }
  const listeners = new Set<() => void>()

  return {
    getSnapshot() {
      return snapshot
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async bootstrap() {
      if (snapshot.status !== "unknown") return

      try {
        const response = await client.me()
        update({ status: "authenticated", user: response.data })
      } catch {
        update({ status: "anonymous", user: null })
      }
    },
    async login(credentials: LoginCredentials) {
      const response = await client.login(credentials)
      update({ status: "authenticated", user: response.data })
      return response.data
    },
    async logout() {
      await client.logout()
      update({ status: "anonymous", user: null })
    },
  }

  function update(next: SessionSnapshot) {
    snapshot = next
    for (const listener of listeners) listener()
  }
}
