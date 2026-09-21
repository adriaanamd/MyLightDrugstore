import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import { SessionStoreProvider } from "@/features/auth/model/context"
import { getAppServices } from "./app-services"

export function AppProviders({ children }: PropsWithChildren) {
  const services = getAppServices()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  )

  useEffect(() => {
    void services.session.bootstrap()
  }, [services.session])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionStoreProvider store={services.session}>
        {children}
      </SessionStoreProvider>
    </QueryClientProvider>
  )
}
