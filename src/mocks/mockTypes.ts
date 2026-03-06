import type { Assignment } from '../types/assignment'
import type { Asset, AssetAttributeInput } from '../types/asset'
import type { EnumOption, AssetAttributeValue, AttributeDefinition } from '../types/attributes'
import type { AuditEvent, SystemLog } from '../types/audit'
import type { Employee } from '../types/employee'
import type { ExportJob } from '../types/exports'
import type { DocumentRecord, StoredFile } from '../types/files'
import type { EntityHistoryRecord } from '../types/history'
import type { ImportJob, ImportRowResult } from '../types/imports'
import type { AssetGroup, Category, Location, Position, ReturnReason } from '../types/reference'
import type { AssetDocument, AssetEvent, ConditionInspection, MaintenanceTicket, StocktakeAudit, StocktakeEntry } from '../types/assetOps'

export interface MockDb {
  assets: Asset[]
  employees: Employee[]
  assignments: Assignment[]
  groups: AssetGroup[]
  categories: Category[]
  locations: Location[]
  positions: Position[]
  returnReasons: ReturnReason[]
  attributes: AttributeDefinition[]
  enumOptions: EnumOption[]
  assetAttributeValues: AssetAttributeValue[]
  files: StoredFile[]
  documents: DocumentRecord[]
  importJobs: ImportJob[]
  importRows: ImportRowResult[]
  exportJobs: ExportJob[]
  auditEvents: AuditEvent[]
  entityHistory: EntityHistoryRecord[]
  systemLogs: SystemLog[]
  assetEvents: AssetEvent[]
  conditionInspections: ConditionInspection[]
  maintenanceTickets: MaintenanceTicket[]
  assetDocuments: AssetDocument[]
  stocktakeAudits: StocktakeAudit[]
  stocktakeEntries: StocktakeEntry[]
  counters: Record<string, number>
}

export interface AssetMutationPayload {
  name: string
  categoryId: number
  locationId: number | null
  serialNumber: string | null
  purchaseDate: string | null
  activationDate: string | null
  purchaseValue: number | null
  comment: string | null
  attributes: AssetAttributeInput[]
}
