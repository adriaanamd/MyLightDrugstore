import type { TransportClient } from "@/shared/api"
import type { User, UserWritePayload } from "../model/types"

export function createUserApi(client: Pick<TransportClient, "request">) {
  return {
    list() {
      return client.request<User[]>("/users")
    },
    show(id: number) {
      return client.request<User>(`/users/${id}`)
    },
    update(id: number, payload: UserWritePayload) {
      return client.request<User>(`/users/${id}`, {
        method: "PATCH",
        body: payload,
      })
    },
  }
}
