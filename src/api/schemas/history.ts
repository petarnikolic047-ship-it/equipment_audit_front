import { z } from 'zod'
import { pagedResultSchema } from './common'

export const entityHistorySchema = z.object({
  id: z.number().int().positive(),
  auditRevisionId: z.number().int().positive(),
  changedAt: z.string(),
  entityType: z.string(),
  entityPk: z.string(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  oldRowJson: z.string().nullable(),
  newRowJson: z.string().nullable(),
})

export const entityHistoryListSchema = pagedResultSchema(entityHistorySchema)
