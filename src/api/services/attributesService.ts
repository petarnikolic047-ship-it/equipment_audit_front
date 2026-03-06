import { z } from 'zod'
import { apiClient, getParsed, postParsed, putParsed } from '../client'
import { attributeDefinitionSchema, enumOptionSchema } from '../schemas/attributes'
import type { AttributeCreateDto, AttributeDefinition, EnumOption } from '../../types/attributes'

export async function fetchAttributes(groupId: number): Promise<AttributeDefinition[]> {
  return getParsed('/admin/attributes', z.array(attributeDefinitionSchema), { groupId })
}

export async function createAttribute(payload: AttributeCreateDto): Promise<AttributeDefinition> {
  return postParsed('/admin/attributes', payload, attributeDefinitionSchema)
}

export async function updateAttribute(id: number, payload: Partial<AttributeCreateDto>): Promise<AttributeDefinition> {
  return putParsed(`/admin/attributes/${id}`, payload, attributeDefinitionSchema)
}

export async function disableAttribute(id: number): Promise<void> {
  await apiClient.post(`/admin/attributes/${id}/disable`)
}

export async function fetchEnumOptions(attributeId: number): Promise<EnumOption[]> {
  return getParsed(`/admin/attributes/${attributeId}/options`, z.array(enumOptionSchema))
}

export async function createEnumOption(attributeId: number, value: string): Promise<EnumOption> {
  return postParsed(`/admin/attributes/${attributeId}/options`, { value }, enumOptionSchema)
}

export async function disableEnumOption(optionId: number): Promise<void> {
  await apiClient.post(`/admin/options/${optionId}/disable`)
}
