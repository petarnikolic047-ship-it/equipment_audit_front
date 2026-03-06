import { z } from 'zod'
import { apiClient, getParsed, postParsed } from '../client'
import { importJobListSchema, importJobSchema, importPreviewSchema, importRowResultSchema } from '../schemas/imports'
import type { ImportJob, ImportPreviewResponse, ImportRowResult } from '../../types/imports'
import type { PagedResult } from '../httpTypes'

export async function fetchImportJobs(params: Record<string, unknown>): Promise<PagedResult<ImportJob>> {
  return getParsed('/imports', importJobListSchema, params)
}

export async function fetchImportJob(id: number): Promise<ImportJob> {
  return getParsed(`/imports/${id}`, importJobSchema)
}

export async function fetchImportRows(id: number, onlyErrors = false): Promise<ImportRowResult[]> {
  return getParsed(`/imports/${id}/rows`, z.array(importRowResultSchema), { onlyErrors })
}

export async function createImportJob(formData: FormData): Promise<{ importJobId: number; storedFileId: number }> {
  return postParsed('/imports', formData, z.object({ importJobId: z.number().int().positive(), storedFileId: z.number().int().positive() }), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function previewImport(id: number): Promise<ImportPreviewResponse> {
  return postParsed(`/imports/${id}/preview`, {}, importPreviewSchema)
}

export async function applyImport(id: number, idempotencyKey: string): Promise<void> {
  await apiClient.post(`/imports/${id}/apply`, { idempotencyKey })
}
