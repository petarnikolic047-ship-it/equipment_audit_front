import { z } from 'zod'
import { apiClient, getParsed, postParsed, putParsed } from '../client'
import { assetCreateResponseSchema, assetListSchema, assetSchema } from '../schemas/asset'
import { assetAttributeValueSchema } from '../schemas/attributes'
import type { Asset, AssetCreateDto, AssetCreateResponse, AssetListParams, AssetUpdateDto } from '../../types/asset'
import type { AssetAttributeValue } from '../../types/attributes'
import type { PagedResult } from '../httpTypes'

const assetDetailSchema = z.object({
  asset: assetSchema,
  attributes: z.array(assetAttributeValueSchema),
  currentAssignmentId: z.number().int().positive().nullable(),
})

export type AssetDetailResponse = {
  asset: Asset
  attributes: AssetAttributeValue[]
  currentAssignmentId: number | null
}

export async function fetchAssets(params: AssetListParams): Promise<PagedResult<Asset>> {
  return getParsed('/assets', assetListSchema, params)
}

export async function fetchAssetDetail(id: number): Promise<AssetDetailResponse> {
  return getParsed(`/assets/${id}`, assetDetailSchema)
}

export async function createAsset(payload: AssetCreateDto): Promise<AssetCreateResponse> {
  return postParsed('/assets', payload, assetCreateResponseSchema)
}

export async function updateAsset(id: number, payload: AssetUpdateDto): Promise<Asset> {
  return putParsed(`/assets/${id}`, payload, assetSchema)
}

export async function disableAsset(id: number, reason: string): Promise<void> {
  await apiClient.post(`/assets/${id}/disable`, { reason })
}
