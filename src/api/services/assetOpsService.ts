import { z } from 'zod'
import { getParsed, postParsed } from '../client'
import { assignmentSchema } from '../schemas/assignment'
import { auditEventSchema } from '../schemas/audit'
import {
  assetDocumentSchema,
  assetEventSchema,
  conditionInspectionSchema,
  maintenanceTicketSchema,
  myEquipmentListSchema,
  stocktakeAuditDetailSchema,
  stocktakeAuditListSchema,
  stocktakeAuditSchema,
  stocktakeEntrySchema,
  stocktakeReconcileResultSchema,
  transferResultSchema,
} from '../schemas/assetOps'
import { entityHistorySchema } from '../schemas/history'
import type {
  InspectionCreateDto,
  MaintenanceCompleteDto,
  MaintenanceCreateDto,
  MyEquipmentRecord,
  StocktakeAudit,
  StocktakeCreateDto,
  StocktakeEntry,
  StocktakeEntryUpdateDto,
  StocktakeReconcileResult,
  TransferRequest,
  TransferResult,
} from '../../types/assetOps'
import type { AssetEvent } from '../../types/assetOps'
import type { Assignment } from '../../types/assignment'
import type { AuditEvent } from '../../types/audit'
import type { EntityHistoryRecord } from '../../types/history'
import type { AssetDocument, ConditionInspection, MaintenanceTicket } from '../../types/assetOps'
import type { PagedResult } from '../httpTypes'

const assetAuditTrailSchema = z.object({
  events: z.array(assetEventSchema),
  assignments: z.array(assignmentSchema),
  auditEvents: z.array(auditEventSchema),
  history: z.array(entityHistorySchema),
})

export type AssetAuditTrail = {
  events: AssetEvent[]
  assignments: Assignment[]
  auditEvents: AuditEvent[]
  history: EntityHistoryRecord[]
}

export async function fetchAssetTimeline(assetId: number, eventType?: string, from?: string, to?: string): Promise<AssetEvent[]> {
  return getParsed(`/assets/${assetId}/events`, z.array(assetEventSchema), {
    eventType: eventType || undefined,
    from: from || undefined,
    to: to || undefined,
  })
}

export async function fetchAssetAssignmentsHistory(assetId: number): Promise<Assignment[]> {
  return getParsed(`/assets/${assetId}/assignments`, z.array(assignmentSchema))
}

export async function fetchAssetInspections(assetId: number): Promise<ConditionInspection[]> {
  return getParsed(`/assets/${assetId}/inspections`, z.array(conditionInspectionSchema))
}

export async function createAssetInspection(assetId: number, payload: InspectionCreateDto): Promise<ConditionInspection> {
  return postParsed(`/assets/${assetId}/inspections`, payload, conditionInspectionSchema)
}

export async function fetchAssetMaintenance(assetId: number): Promise<MaintenanceTicket[]> {
  return getParsed(`/assets/${assetId}/maintenance`, z.array(maintenanceTicketSchema))
}

export async function createMaintenanceTicket(assetId: number, payload: MaintenanceCreateDto): Promise<MaintenanceTicket> {
  return postParsed(`/assets/${assetId}/maintenance`, payload, maintenanceTicketSchema)
}

export async function completeMaintenanceTicket(ticketId: number, payload: MaintenanceCompleteDto): Promise<MaintenanceTicket> {
  return postParsed(`/maintenance/${ticketId}/complete`, payload, maintenanceTicketSchema)
}

export async function fetchAssetDocuments(assetId: number): Promise<AssetDocument[]> {
  return getParsed(`/assets/${assetId}/documents`, z.array(assetDocumentSchema))
}

export async function fetchAssetAuditTrail(assetId: number): Promise<AssetAuditTrail> {
  return getParsed(`/assets/${assetId}/audit-trail`, assetAuditTrailSchema)
}

export async function transferCustody(payload: TransferRequest): Promise<TransferResult> {
  return postParsed('/assets/transfer', payload, transferResultSchema)
}

export async function fetchStocktakeAudits(params: Record<string, unknown>): Promise<PagedResult<StocktakeAudit>> {
  return getParsed('/stocktakes', stocktakeAuditListSchema, params)
}

export async function createStocktakeAudit(payload: StocktakeCreateDto): Promise<StocktakeAudit> {
  return postParsed('/stocktakes', payload, stocktakeAuditSchema)
}

export async function fetchStocktakeAuditDetail(auditId: number): Promise<{ audit: StocktakeAudit; entries: StocktakeEntry[] }> {
  return getParsed(`/stocktakes/${auditId}`, stocktakeAuditDetailSchema)
}

export async function startStocktakeAudit(auditId: number): Promise<StocktakeAudit> {
  return postParsed(`/stocktakes/${auditId}/start`, {}, stocktakeAuditSchema)
}

export async function upsertStocktakeEntry(auditId: number, payload: StocktakeEntryUpdateDto): Promise<StocktakeEntry> {
  return postParsed(`/stocktakes/${auditId}/entries`, payload, stocktakeEntrySchema)
}

export async function reconcileStocktake(auditId: number): Promise<StocktakeReconcileResult> {
  return postParsed(`/stocktakes/${auditId}/reconcile`, {}, stocktakeReconcileResultSchema)
}

export async function finalizeStocktake(auditId: number): Promise<StocktakeAudit> {
  return postParsed(`/stocktakes/${auditId}/finalize`, {}, stocktakeAuditSchema)
}

export async function fetchMyEquipment(userId?: number): Promise<{ current: MyEquipmentRecord[]; history: MyEquipmentRecord[] }> {
  return getParsed('/me/equipment', myEquipmentListSchema, {
    userId: userId || undefined,
  })
}
