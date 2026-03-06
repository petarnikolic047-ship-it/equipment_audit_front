import { getParsed } from '../client'
import { entityHistoryListSchema } from '../schemas/history'
import type { PagedResult } from '../httpTypes'
import type { EntityHistoryRecord } from '../../types/history'

export async function fetchEntityHistory(params: Record<string, unknown>): Promise<PagedResult<EntityHistoryRecord>> {
  return getParsed('/history', entityHistoryListSchema, params)
}
