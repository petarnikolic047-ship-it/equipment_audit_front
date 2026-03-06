import { z } from 'zod'

export const roleSchema = z.enum(['ADMIN', 'EMPLOYEE', 'MVP', 'MANAGER', 'READ_ONLY', 'OWNER'])

export const permissionSchema = z.enum([
  'ASSET_EDIT',
  'EMPLOYEE_EDIT',
  'REFERENCE_MANAGE',
  'ATTRIBUTE_MANAGE',
  'EXPORT_RUN',
  'IMPORT_RUN',
  'STOCKTAKE_RUN',
  'AUDIT_VIEW',
])

export const userInfoSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  employeeId: z.number().int().positive().nullable().optional(),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  role: roleSchema,
  permissions: z.array(permissionSchema),
  userInfo: userInfoSchema,
})
