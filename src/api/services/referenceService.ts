import { z } from 'zod'
import { apiClient, getParsed, postParsed, putParsed } from '../client'
import { categorySchema, groupSchema, locationSchema, positionSchema, returnReasonSchema } from '../schemas/reference'
import type { AssetGroup, Category, Location, Position, ReferenceCreateDto, ReturnReason } from '../../types/reference'

export async function fetchGroups(): Promise<AssetGroup[]> {
  return getParsed('/reference/groups', z.array(groupSchema))
}

export async function fetchCategories(): Promise<Category[]> {
  return getParsed('/reference/categories', z.array(categorySchema))
}

export async function fetchLocations(): Promise<Location[]> {
  return getParsed('/reference/locations', z.array(locationSchema))
}

export async function fetchPositions(): Promise<Position[]> {
  return getParsed('/reference/positions', z.array(positionSchema))
}

export async function fetchReturnReasons(): Promise<ReturnReason[]> {
  return getParsed('/reference/return-reasons', z.array(returnReasonSchema))
}

export async function createReference<T>(endpoint: string, payload: ReferenceCreateDto, schema: z.ZodType<T>): Promise<T> {
  return postParsed(endpoint, payload, schema)
}

export async function updateReference<T>(
  endpoint: string,
  id: number,
  payload: ReferenceCreateDto,
  schema: z.ZodType<T>,
): Promise<T> {
  return putParsed(`${endpoint}/${id}`, payload, schema)
}

export async function disableReference(endpoint: string, id: number): Promise<void> {
  await apiClient.post(`${endpoint}/${id}/disable`)
}
