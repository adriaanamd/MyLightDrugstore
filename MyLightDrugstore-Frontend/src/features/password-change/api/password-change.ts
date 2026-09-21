import type { ChangePasswordPayload } from "@/features/auth"
import type { AuthSessionClient } from "@/features/auth/model/types"

export function createPasswordChange(client: AuthSessionClient) {
  return {
    async submit(payload: ChangePasswordPayload) {
      if (!client.changePassword) {
        throw new Error("Password change is unavailable.")
      }
      await client.changePassword(payload)
    },
  }
}
