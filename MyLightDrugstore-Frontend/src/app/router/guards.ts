import { redirect } from "@tanstack/react-router"
import type { SessionStore } from "@/features/auth/model/types"

export type AuthRouteContext = {
  session: Pick<SessionStore, "getSnapshot" | "bootstrap">
}

export function requireAuthenticated({ session }: AuthRouteContext) {
  const snapshot = session.getSnapshot()
  if (snapshot.status !== "authenticated" || !snapshot.user) {
    throw redirect({ href: "/login" })
  }

  return snapshot.user
}
