import type { Page } from "@/entities/shared/model/page"

export type UserId = number

export type UserRole = "admin" | "staff"

export type User = {
  id: UserId

  username: string

  fullName: string

  role: UserRole

  active: boolean

  createdAt: string

  updatedAt: string | null
}

export type UserCreatePayload = {
  username: string

  fullName: string

  password: string

  role: UserRole
}

export type UserUpdatePayload = {
  fullName?: string

  role?: UserRole

  active?: boolean
}

export type UserListParams = {
  active?: boolean

  page?: number

  perPage?: number
}

export type UserWritePayload = UserUpdatePayload

export type UserPage = Page<User>
