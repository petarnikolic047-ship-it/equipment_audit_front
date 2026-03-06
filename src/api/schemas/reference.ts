import { z } from 'zod'

export const groupSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  enabled: z.boolean(),
})

export const categorySchema = z.object({
  id: z.number().int().positive(),
  groupId: z.number().int().positive(),
  groupName: z.string(),
  code: z.string(),
  name: z.string(),
  enabled: z.boolean(),
})

export const locationSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  enabled: z.boolean(),
})

export const positionSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  enabled: z.boolean(),
})

export const returnReasonSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  reasonText: z.string(),
  isMalfunction: z.boolean(),
  enabled: z.boolean(),
})
