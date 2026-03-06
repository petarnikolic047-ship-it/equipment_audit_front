import { z } from 'zod'
import { pagedResultSchema } from './common'

export const assignmentSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  assetName: z.string(),
  assetInventoryNumber: z.string(),
  employeeId: z.number().int().positive(),
  employeeFullName: z.string(),
  employeeJmbgMasked: z.string(),
  takenAt: z.string(),
  dueAt: z.string().nullable(),
  returnedAt: z.string().nullable(),
  returnReasonId: z.number().int().positive().nullable(),
  returnReasonName: z.string().nullable(),
  notes: z.string().nullable(),
  reversFileId: z.number().int().positive().nullable(),
  employeeActive: z.boolean(),
})

export const assignmentListSchema = pagedResultSchema(assignmentSchema)

export const assignmentCreateResponseSchema = z.object({
  assignmentId: z.number().int().positive(),
  documentId: z.number().int().positive(),
  fileId: z.number().int().positive(),
  downloadEndpoint: z.string(),
})
