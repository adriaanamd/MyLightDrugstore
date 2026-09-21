import type { Backup } from "@/entities/backup"

export type BackupApi = {
  create?: () => Promise<{ data: Backup }>
  show?: (id: string) => Promise<{ data: Backup }>
  download: (id: number) => Promise<Uint8Array | { data: Uint8Array }>
}

export function createBackupManager(api: BackupApi) {
  return {
    async create() {
      if (!api.create) throw new Error("Backup creation is unavailable.")
      return (await api.create()).data
    },
    async status(id: string | number) {
      if (!api.show) throw new Error("Backup status is unavailable.")
      return (await api.show(String(id))).data
    },
    async download(id: number) {
      const response = await api.download(id)
      return response instanceof Uint8Array ? response : response.data
    },
  }
}
