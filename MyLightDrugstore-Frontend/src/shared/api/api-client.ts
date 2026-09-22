import { createTransportClient, type TransportClient } from "./transport/client"

export type ApiClientDependencies = {
  transport: TransportClient
}

export type ApiClientOptions = {
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export function createApiClient(
  options: ApiClientOptions = {},
): ApiClientDependencies {
  return {
    transport: createTransportClient({
      baseUrl:
        options.baseUrl ??
        import.meta.env.VITE_API_BASE_URL ??
        "http://localhost:8000/api/v1",
      fetchImpl: options.fetchImpl,
    }),
  }
}

export const apiClient = createApiClient()
