export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>
