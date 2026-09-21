import { useSyncExternalStore } from "react"
import type { SessionStore } from "./types"

export function useSession(store: SessionStore) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
}
