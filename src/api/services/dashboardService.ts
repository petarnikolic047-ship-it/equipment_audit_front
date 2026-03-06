import { z } from 'zod'
import { getParsed } from '../client'

const dashboardStatsSchema = z.object({
  assets: z.number().int().nonnegative(),
  activeAssignments: z.number().int().nonnegative(),
  employees: z.number().int().nonnegative(),
  importJobs: z.number().int().nonnegative(),
})

export type DashboardStats = z.infer<typeof dashboardStatsSchema>

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return getParsed('/dashboard/stats', dashboardStatsSchema)
}
