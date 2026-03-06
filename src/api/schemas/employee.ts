import { z } from 'zod'
import { pagedResultSchema } from './common'

export const employeeSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  jmbg: z.string(),
  phone: z.string(),
  address: z.string().nullable(),
  positionId: z.number().int().positive(),
  positionName: z.string(),
  isActive: z.boolean(),
  deactivatedAt: z.string().nullable(),
  hasActiveAssignments: z.boolean().optional(),
})

export const employeeListSchema = pagedResultSchema(employeeSchema)
