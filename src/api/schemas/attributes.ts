import { z } from 'zod'

export const attributeValueTypeSchema = z.enum(['INTEGER', 'BOOLEAN', 'STRING', 'ENUM', 'EMPLOYEE_REF'])

export const attributeDefinitionSchema = z.object({
  id: z.number().int().positive(),
  groupId: z.number().int().positive(),
  label: z.string(),
  valueType: attributeValueTypeSchema,
  required: z.boolean(),
  enabled: z.boolean(),
})

export const enumOptionSchema = z.object({
  id: z.number().int().positive(),
  attributeId: z.number().int().positive(),
  value: z.string(),
  enabled: z.boolean(),
})

export const assetAttributeValueSchema = z.object({
  id: z.number().int().positive(),
  assetId: z.number().int().positive(),
  attributeId: z.number().int().positive(),
  valueInteger: z.number().nullable(),
  valueBoolean: z.boolean().nullable(),
  valueString: z.string().nullable(),
  valueEnumOptionId: z.number().int().positive().nullable(),
  valueEmployeeId: z.number().int().positive().nullable(),
})
