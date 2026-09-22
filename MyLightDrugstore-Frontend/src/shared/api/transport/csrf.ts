export type CsrfFetcher = () => Promise<string>

let csrfToken: string | null = null
let csrfPromise: Promise<string> | undefined

export function getCsrfToken(): string | null {
  return csrfToken
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token?.trim() || null
}

export function clearCsrfToken(): void {
  csrfToken = null
  csrfPromise = undefined
}

export function isSafeMethod(method?: string): boolean {
  const normalizedMethod = (method ?? "GET").toUpperCase()
  return ["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)
}

export async function ensureCsrfToken(
  fetchCsrf: CsrfFetcher,
): Promise<string> {
  if (csrfToken) {
    return csrfToken
  }

  csrfPromise ??= fetchCsrf()
    .then((token) => {
      const normalizedToken = token.trim()

      if (!normalizedToken) {
        throw new Error("The CSRF token response is invalid.")
      }

      csrfToken = normalizedToken
      return normalizedToken
    })
    .finally(() => {
      csrfPromise = undefined
    })

  return csrfPromise
}
