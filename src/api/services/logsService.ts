import { getParsed } from '../client'
import { auditEventListSchema, systemLogListSchema } from '../schemas/audit'
import type { PagedResult } from '../httpTypes'
import type { AuditEvent, SystemLog } from '../../types/audit'

export async function fetchAuditEvents(params: Record<string, unknown>): Promise<PagedResult<AuditEvent>> {
  return getParsed('/audit/events', auditEventListSchema, params)
}

export async function fetchSystemLogs(params: Record<string, unknown>): Promise<PagedResult<SystemLog>> {
  return getParsed('/logs/system', systemLogListSchema, params)
}
