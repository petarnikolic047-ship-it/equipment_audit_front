export interface AssetEvent {
  id: number
  assetId: number
  eventType: string
  occurredAt: string
  recordedAt: string
  actor: string
  source: 'BUSINESS' | 'MANUAL_OVERRIDE' | 'SYSTEM'
  note: string | null
}

export type ConditionGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'

export interface ConditionInspection {
  id: number
  assetId: number
  conditionGrade: ConditionGrade
  findings: string | null
  auditor: string | null
  occurredAt: string
  recordedAt: string
  actor: string
}

export type MaintenanceStatus = 'OPEN' | 'CLOSED'

export interface MaintenanceTicket {
  id: number
  assetId: number
  title: string
  status: MaintenanceStatus
  openedAt: string
  expectedReturnAt: string | null
  closedAt: string | null
  downtimeHours: number | null
  cost: number | null
  reportFileId: number | null
  notes: string | null
  createdBy: string
}

export interface AssetDocument {
  id: number
  assetId: number
  docType: 'REVERS' | 'INVOICE' | 'PHOTO' | 'SERVICE_REPORT' | 'TRANSFER_CONFIRMATION'
  fileId: number
  assignmentId: number | null
  createdAt: string
}

export interface TransferRequest {
  assetIds: number[]
  fromEmployeeId?: number | null
  toEmployeeId?: number | null
  fromLocationId?: number | null
  toLocationId?: number | null
  confirmationChecked: boolean
  notes: string | null
  evidenceFileName?: string | null
}

export interface TransferResult {
  transferId: number
  occurredAt: string
  documentFileId: number | null
  message: string
}

export interface StocktakeAudit {
  id: number
  name: string
  scopeLocationId: number | null
  scopeCategoryId: number | null
  scopeLocationName: string | null
  scopeCategoryName: string | null
  status: 'DRAFT' | 'IN_PROGRESS' | 'RECONCILING' | 'FINALIZED'
  createdAt: string
  startedAt: string | null
  finalizedAt: string | null
  reportFileId: number | null
  discrepancyCount: number
  notes: string | null
}

export interface StocktakeEntry {
  id: number
  auditId: number
  assetId: number
  inventoryNumber: string
  assetName: string
  expectedLocationName: string | null
  actualLocationName: string | null
  found: boolean
  conditionGrade: ConditionGrade | null
  discrepancyType: 'NONE' | 'MISSING' | 'LOCATION_MISMATCH' | 'STATUS_MISMATCH'
  notes: string | null
  recordedAt: string
}

export interface InspectionCreateDto {
  conditionGrade: ConditionGrade
  findings: string | null
  occurredAt: string
  auditor: string | null
}

export interface MaintenanceCreateDto {
  title: string
  expectedReturnAt: string | null
  notes: string | null
}

export interface MaintenanceCompleteDto {
  cost: number | null
  downtimeHours: number | null
  conditionGrade: ConditionGrade | null
  notes: string | null
  reportFileName?: string | null
}

export interface StocktakeCreateDto {
  name: string
  scopeLocationId: number | null
  scopeCategoryId: number | null
  notes: string | null
}

export interface StocktakeEntryUpdateDto {
  assetId: number
  found: boolean
  conditionGrade: ConditionGrade | null
  actualLocationId: number | null
  notes: string | null
}

export interface StocktakeReconcileResult {
  discrepancyCount: number
  proposedUpdates: Array<{
    assetId: number
    inventoryNumber: string
    action: 'MARK_MISSING' | 'MOVE_LOCATION' | 'UPDATE_STATUS'
    fromValue: string | null
    toValue: string | null
  }>
}

export interface MyEquipmentRecord {
  assignmentId: number
  assetId: number
  inventoryNumber: string
  assetName: string
  status: string
  takenAt: string
  returnedAt: string | null
  reversFileId: number | null
}
