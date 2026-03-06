import { z } from 'zod'
import { pagedResultSchema } from './common'

export const exportJobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'])

export const exportJobSchema = z.object({
  id: z.number().int().positive(),
  type: z.string(),
  format: z.enum(['XLSX', 'CSV', 'PDF']),
  status: exportJobStatusSchema,
  filterJson: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  outputFileId: z.number().int().positive().nullable(),
  errorMessage: z.string().nullable(),
  pollCount: z.number().int().nonnegative(),
})

export const exportJobListSchema = pagedResultSchema(exportJobSchema)
