import { z } from 'zod'
import { pagedResultSchema } from './common'

export const auditEventSchema = z.object({
  id: z.number().int().positive(),
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actor: z.string(),
  at: z.string(),
  metadataJson: z.string(),
})

export const auditEventListSchema = pagedResultSchema(auditEventSchema)

export const systemLogSchema = z.object({
  id: z.number().int().positive(),
  severity: z.enum(['INFO', 'WARN', 'ERROR']),
  message: z.string(),
  requestId: z.string(),
  at: z.string(),
  contextJson: z.string(),
})

export const systemLogListSchema = pagedResultSchema(systemLogSchema)
