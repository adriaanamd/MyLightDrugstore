import { useEffect, useState } from "react"

import { createSystemApi } from "@/entities/system"
import { apiClient } from "@/shared/api/api-client"
import { formatTime } from "@/shared/ui"

const systemApi = createSystemApi(apiClient.transport)

export function useServerClock(intervalMs = 1000) {
  const [clock, setClock] = useState("")
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let active = true

    const tick = async () => {
      try {
        const result = await systemApi.getServerTime()

        if (active) {
          setClock(formatTime(result.now))
          setError(null)
        }
      } catch (cause: unknown) {
        if (active) {
          setError(cause)
        }
      }
    }

    void tick()
    const timer = setInterval(() => void tick(), intervalMs)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [intervalMs])

  return { clock, error }
}
