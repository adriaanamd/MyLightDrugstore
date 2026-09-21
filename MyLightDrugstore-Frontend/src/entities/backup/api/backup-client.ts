import type { TransportClient } from "@/shared/api"
import type { Backup } from "../model/types"

export function createBackupApi(client: Pick<TransportClient, "request">) {
  return {
    create() {
      return client.request<Backup>("/backups", { method: "POST" })
    },
    show(id: string) {
      return client.request<Backup>(`/backups/${id}`, { method: "GET" })
    },
    download(id: string) {
      return client.request<Uint8Array>(`/backups/${id}/download`, {
        method: "GET",
      })
    },
  }
}
