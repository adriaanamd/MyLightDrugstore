export type User = {
  id: number

  name: string

  email: string

  role?: string

  isActive?: boolean
}

export type UserWritePayload = {
  name?: string

  email?: string

  role?: string

  isActive?: boolean
}
