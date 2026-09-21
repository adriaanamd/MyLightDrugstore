import type { User, UserWritePayload } from "@/entities/user"

export type StaffApi = {
  list: () => Promise<{ data: User[] }>
  update: (id: number, payload: UserWritePayload) => Promise<unknown>
}

export function createStaffManager(api: StaffApi) {
  return {
    list() {
      return api.list()
    },
    deactivate(id: number) {
      return api.update(id, { isActive: false })
    },
  }
}
