import { z } from 'zod'
import { pagedResultSchema } from './common'

export const assetStatusSchema = z.enum(['IN_STOCK', 'ASSIGNED', 'UNDER_SERVICE', 'DISABLED'])

export const assetSchema = z.object({
  id: z.number().int().positive(),
  inventoryNumber: z.string(),
  name: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  groupId: z.number().int().positive(),
  locationId: z.number().int().positive().nullable(),
  locationName: z.string().nullable(),
  serialNumber: z.string().nullable(),
  status: assetStatusSchema,
  purchaseDate: z.string().nullable(),
  activationDate: z.string().nullable(),
  purchaseValue: z.number().nullable(),
  comment: z.string().nullable(),
  isActive: z.boolean(),
  isMissing: z.boolean(),
  lastSeenAuditAt: z.string().nullable(),
})

export const assetListSchema = pagedResultSchema(assetSchema)

export const assetCreateResponseSchema = z.object({
  id: z.number().int().positive(),
  inventoryNumber: z.string(),
})
