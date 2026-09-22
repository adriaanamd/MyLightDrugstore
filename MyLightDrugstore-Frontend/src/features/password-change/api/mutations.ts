import { useCallback, useState } from "react"

import { useAuthSession } from "@/features/auth"
import type { ApiError } from "@/shared/api"
import { normalizeApiError } from "@/shared/api"

import type { PasswordChangeFormValues } from "../model/forms"

export function useChangePassword() {
  const auth = useAuthSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const execute = useCallback(
    async (values: PasswordChangeFormValues): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        await auth.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      } catch (cause: unknown) {
        const apiError = normalizeApiError(cause)
        setError(apiError)
        throw apiError
      } finally {
        setLoading(false)
      }
    },
    [auth],
  )

  return { execute, loading, error }
}
