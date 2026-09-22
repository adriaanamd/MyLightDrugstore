export type PageMeta = {
  page: number

  perPage: number

  total: number

  lastPage?: number
}

export type Page<T,> = {
  data: T[]

  meta: PageMeta
}
