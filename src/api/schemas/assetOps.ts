import { z } from 'zod'
import { pagedResultSchema } from './common'

export const conditionGradeSchema = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])

export const assetEventSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  eventType: z.string(),
  occurredAt: z.string(),
  recordedAt: z.string(),
  actor: z.string(),
  source: z.enum(['BUSINESS', 'MANUAL_OVERRIDE', 'SYSTEM']),
  note: z.string().nullable(),
})

export const conditionInspectionSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  conditionGrade: conditionGradeSchema,
  findings: z.string().nullable(),
  auditor: z.string().nullable(),
  occurredAt: z.string(),
  recordedAt: z.string(),
  actor: z.string(),
})

export const maintenanceTicketSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  title: z.string(),
  status: z.enum(['OPEN', 'CLOSED']),
  openedAt: z.string(),
  expectedReturnAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  downtimeHours: z.number().nullable(),
  cost: z.number().nullable(),
  reportFileId: z.number().int().positive().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string(),
})

export const assetDocumentSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  docType: z.enum(['REVERS', 'INVOICE', 'PHOTO', 'SERVICE_REPORT', 'TRANSFER_CONFIRMATION']),
  fileId: z.number().int().positive(),
  assignmentId: z.number().int().positive().nullable(),
  createdAt: z.string(),
})

export const transferResultSchema = z.object({
  transferId: z.number().int().positive(),
  occurredAt: z.string(),
  documentFileId: z.number().int().positive().nullable(),
  message: z.string(),
})

export const stocktakeAuditSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  scopeLocationId: z.number().int().positive().nullable(),
  scopeCategoryId: z.number().int().positive().nullable(),
  scopeLocationName: z.string().nullable(),
  scopeCategoryName: z.string().nullable(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'RECONCILING', 'FINALIZED']),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finalizedAt: z.string().nullable(),
  reportFileId: z.number().int().positive().nullable(),
  discrepancyCount: z.number().int().nonnegative(),
  notes: z.string().nullable(),
})

export const stocktakeEntrySchema = z.object({
  id: z.number().int().positive(),
  auditId: z.number().int().positive(),
  assetId: z.number().int().positive(),
  inventoryNumber: z.string(),
  assetName: z.string(),
  expectedLocationName: z.string().nullable(),
  actualLocationName: z.string().nullable(),
  found: z.boolean(),
  conditionGrade: conditionGradeSchema.nullable(),
  discrepancyType: z.enum(['NONE', 'MISSING', 'LOCATION_MISMATCH', 'STATUS_MISMATCH']),
  notes: z.string().nullable(),
  recordedAt: z.string(),
})

export const stocktakeAuditListSchema = pagedResultSchema(stocktakeAuditSchema)

export const stocktakeAuditDetailSchema = z.object({
  audit: stocktakeAuditSchema,
  entries: z.array(stocktakeEntrySchema),
})

export const stocktakeReconcileResultSchema = z.object({
  discrepancyCount: z.number().int().nonnegative(),
  proposedUpdates: z.array(
    z.object({
      assetId: z.number().int().positive(),
      inventoryNumber: z.string(),
      action: z.enum(['MARK_MISSING', 'MOVE_LOCATION', 'UPDATE_STATUS']),
      fromValue: z.string().nullable(),
      toValue: z.string().nullable(),
    }),
  ),
})

export const myEquipmentRecordSchema = z.object({
  assignmentId: z.number().int().positive(),
  assetId: z.number().int().positive(),
  inventoryNumber: z.string(),
  assetName: z.string(),
  status: z.string(),
  takenAt: z.string(),
  returnedAt: z.string().nullable(),
  reversFileId: z.number().int().positive().nullable(),
})

export const myEquipmentListSchema = z.object({
  current: z.array(myEquipmentRecordSchema),
  history: z.array(myEquipmentRecordSchema),
})
