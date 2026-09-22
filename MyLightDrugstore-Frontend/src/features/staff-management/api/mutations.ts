import { ApiError } from "@/shared/api"
import {
  createUserApi,
  type UserCreatePayload,
  type UserId,
  type UserRole,
  type UserUpdatePayload,
} from "@/entities/user"
import { apiClient } from "@/shared/api/api-client"

export type StaffApi = ReturnType<typeof createUserApi>

const staffApi = createUserApi(apiClient.transport)

export function createStaffActions(api: StaffApi, role: UserRole) {
  return {
    async create(payload: UserCreatePayload) {
      assertAdmin(role)
      return api.create(payload)
    },

    async update(id: UserId, payload: UserUpdatePayload) {
      assertAdmin(role)
      return api.update(id, payload)
    },

    async deactivate(id: UserId) {
      assertAdmin(role)
      return api.update(id, { active: false })
    },
  }
}

export function createDefaultStaffActions(role: UserRole) {
  return createStaffActions(staffApi, role)
}

function assertAdmin(role: UserRole): void {
  if (role !== "admin") {
    throw new ApiError("Administrator access is required.", 403, "forbidden")
  }
}
