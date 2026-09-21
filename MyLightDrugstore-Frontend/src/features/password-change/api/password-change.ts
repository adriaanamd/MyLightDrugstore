import type { AuthSessionClient, ChangePasswordPayload } from "@/features/auth"

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
