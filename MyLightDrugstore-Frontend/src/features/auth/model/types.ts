import type {
  AuthUserProfile,
  ChangePasswordPayload,
  LoginCredentials,
} from "../api/auth-client"
import type { TransportResponse } from "@/shared/api"

export type SessionStatus = "unknown" | "anonymous" | "authenticated"

export type SessionSnapshot = {
  status: SessionStatus
  user: AuthUserProfile | null
}

export type AuthSessionClient = {
  me(): Promise<TransportResponse<AuthUserProfile>>
  login(
    credentials: LoginCredentials,
  ): Promise<TransportResponse<AuthUserProfile>>
  logout(): Promise<TransportResponse<undefined>>
  changePassword?(
    payload: ChangePasswordPayload,
  ): Promise<TransportResponse<undefined>>
}

export type SessionStore = {
  getSnapshot(): SessionSnapshot
  subscribe(listener: () => void): () => void
  bootstrap(): Promise<void>
  login(credentials: LoginCredentials): Promise<AuthUserProfile>
  logout(): Promise<void>
}
