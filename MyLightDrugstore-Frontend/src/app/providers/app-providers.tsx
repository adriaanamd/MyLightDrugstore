import type { ReactNode } from "react"

import { createAuthClient } from "@/features/auth"
import { AuthProvider } from "@/features/auth"
import { apiClient } from "@/shared/api/api-client"
import { ToastContainer } from "@/shared/ui"

const authClient = createAuthClient(apiClient.transport)

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider client={authClient}>
      {children}
      <ToastContainer />
    </AuthProvider>
  )
}
