import { redirect } from "@tanstack/react-router"

export type AuthenticatedUser = {
  id: number
  name: string
}

export type AuthRouteContext = {
  user: AuthenticatedUser | null
}

export function requireAuthenticated({ user }: AuthRouteContext) {
  if (!user) {
    throw redirect({ href: "/login" })
  }

  return user
}
