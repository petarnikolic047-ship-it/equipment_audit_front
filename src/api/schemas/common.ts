import { z } from 'zod'

export const idSchema = z.number().int().positive()

export const pagedResultSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  })

export const apiErrorSchema = z.object({
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
})

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>
