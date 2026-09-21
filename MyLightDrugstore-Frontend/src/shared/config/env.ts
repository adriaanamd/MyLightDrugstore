export type RuntimeEnv = {
  apiBaseUrl: string
}

type RuntimeEnvSource = {
  VITE_API_BASE_URL?: string
}

export function readRuntimeEnv(input: RuntimeEnvSource = {}): RuntimeEnv {
  if (input.VITE_API_BASE_URL === undefined) {
    return { apiBaseUrl: "/api/v1" }
  }

  const apiBaseUrl = input.VITE_API_BASE_URL.trim()
  if (!apiBaseUrl) {
    throw new Error("The API base URL cannot be empty.")
  }

  return { apiBaseUrl }
}

export const runtimeEnv = readRuntimeEnv({
  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL,
})
