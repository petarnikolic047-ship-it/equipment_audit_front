export interface AuditRevision {
  id: number
  txId: string
  actorUsername: string
  createdAt: string
}

export interface EntityHistoryRecord {
  id: number
  auditRevisionId: number
  changedAt: string
  entityType: string
  entityPk: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  oldRowJson: string | null
  newRowJson: string | null
}
