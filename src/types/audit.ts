export interface AuditEvent {
  id: number
  eventType: string
  entityType: string
  entityId: string
  actor: string
  at: string
  metadataJson: string
}

export interface SystemLog {
  id: number
  severity: 'INFO' | 'WARN' | 'ERROR'
  message: string
  requestId: string
  at: string
  contextJson: string
}
