import type { ReactNode } from "react"
import { Navigate } from "@tanstack/react-router"

import { useAuthSession } from "@/features/auth"
import AppShell from "@/widgets/AppShell"
import { Spinner } from "@/shared/ui"

type AuthenticatedPageProps = {
  children: ReactNode
  adminOnly?: boolean
  shell?: boolean
}

export function AuthenticatedPage({
  children,
  adminOnly = false,
  shell = true,
}: AuthenticatedPageProps) {
  const { user, status } = useAuthSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return shell ? <AppShell>{children}</AppShell> : children
}
