import { z } from 'zod'
import { pagedResultSchema } from './common'

export const importJobStatusSchema = z.enum([
  'QUEUED',
  'VALIDATING',
  'READY_TO_APPLY',
  'APPLYING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
])

export const importJobSchema = z.object({
  id: z.number().int().positive(),
  importType: z.string(),
  status: importJobStatusSchema,
  createdBy: z.string(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  sourceFileId: z.number().int().positive().nullable(),
  errorReportFileId: z.number().int().positive().nullable(),
  summaryCreated: z.number().int().nonnegative(),
  summaryUpdated: z.number().int().nonnegative(),
  summarySkipped: z.number().int().nonnegative(),
  summaryErrors: z.number().int().nonnegative(),
  pollCount: z.number().int().nonnegative(),
})

export const importRowResultSchema = z.object({
  id: z.number().int().positive(),
  importJobId: z.number().int().positive(),
  rowNumber: z.number().int().positive(),
  action: z.enum(['CREATE', 'UPDATE', 'SKIP']),
  errorCode: z.string().nullable(),
  message: z.string(),
  rawRowJson: z.string(),
})

export const importJobListSchema = pagedResultSchema(importJobSchema)

export const importPreviewSchema = z.object({
  summary: z.object({
    summaryCreated: z.number().int().nonnegative(),
    summaryUpdated: z.number().int().nonnegative(),
    summarySkipped: z.number().int().nonnegative(),
    summaryErrors: z.number().int().nonnegative(),
  }),
  sampleRows: z.array(importRowResultSchema),
})
