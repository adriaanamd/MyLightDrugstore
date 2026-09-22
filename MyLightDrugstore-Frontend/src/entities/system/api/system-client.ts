import { type TransportClient, TransportRequestError } from "@/shared/api"
import { unwrapData } from "@/shared/api/query"

export type ServerTime = {
  now: string
}

export function createSystemApi(client: Pick<TransportClient, "request">) {
  return {
    async getServerTime(): Promise<ServerTime> {
      const response = await client.request<unknown>("/system/time", {
        method: "GET",
      })

      const value = unwrapData(response.data)

      if (!isRecord(value) || typeof value.now !== "string") {
        throw new TransportRequestError(
          "The server time response is invalid.",
          0,
          "transport_error",
        )
      }

      return { now: value.now }
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
