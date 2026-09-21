import type { ReactNode } from 'react'
import { SessionProvider } from '@/shared/SessionContext'
import { ToastContainer } from '@/shared/ui'

export function AppProviders({ children }: { children: ReactNode }) {
  return <SessionProvider><>{children}<ToastContainer /></></SessionProvider>
}
