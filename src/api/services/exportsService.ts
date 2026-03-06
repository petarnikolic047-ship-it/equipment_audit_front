import { z } from 'zod'
import { apiClient, getParsed, postParsed } from '../client'
import { exportJobListSchema, exportJobSchema } from '../schemas/exports'
import type { ExportCreateDto, ExportJob } from '../../types/exports'
import type { PagedResult } from '../httpTypes'

export async function fetchExportJobs(params: Record<string, unknown>): Promise<PagedResult<ExportJob>> {
  return getParsed('/exports', exportJobListSchema, params)
}

export async function fetchExportJob(id: number): Promise<ExportJob> {
  return getParsed(`/exports/${id}`, exportJobSchema)
}

export async function createExportJob(payload: ExportCreateDto): Promise<{ exportJobId: number }> {
  return postParsed('/exports', payload, z.object({ exportJobId: z.number().int().positive() }))
}

export async function cancelExportJob(id: number): Promise<void> {
  await apiClient.post(`/exports/${id}/cancel`)
}
