export type QueryValue = string | number | boolean | null | undefined

export type PageMeta = {
  page: number
  perPage: number
  total: number
}

export function withQuery(
  path: string,
  params: Record<string, QueryValue>,
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value))
    }
  }

  const encoded = query.toString()
  return encoded ? `${path}?${encoded}` : path
}

export function unwrapData(body: unknown): unknown {
  if (isRecord(body) && Object.keys(body).length === 1 && "data" in body) {
    return body.data
  }

  return body
}

export function readPageMeta(body: unknown, fallbackLength = 0): PageMeta {
  if (!isRecord(body) || !isRecord(body.meta)) {
    return {
      page: 1,
      perPage: fallbackLength,
      total: fallbackLength,
    }
  }

  return {
    page: readPositiveInteger(body.meta.page, 1),
    perPage: readPositiveInteger(body.meta.perPage, fallbackLength),
    total: readNonNegativeInteger(body.meta.total, fallbackLength),
  }
}

function readPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback
}

function readNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
