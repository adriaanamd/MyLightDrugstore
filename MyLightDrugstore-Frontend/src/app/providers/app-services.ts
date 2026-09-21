import { createAuthClient } from "@/features/auth"
import { createSessionStore } from "@/features/auth/model/session"
import type { SessionStore } from "@/features/auth/model/types"
import { createTransportClient, type TransportClient } from "@/shared/api"
import { runtimeEnv } from "@/shared/config/env"

export type AppServices = {
  transport: TransportClient
  session: SessionStore
}

let services: AppServices | undefined

export function getAppServices(): AppServices {
  services ??= createServices()
  return services
}

function createServices(): AppServices {
  const transport = createTransportClient({ baseUrl: runtimeEnv.apiBaseUrl })
  const auth = createAuthClient(transport)
  return {
    transport,
    session: createSessionStore(auth),
  }
}
