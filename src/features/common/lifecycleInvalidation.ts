import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

interface LifecycleInvalidateOptions {
  assetId?: number
  employeeId?: number
  assignmentId?: number
  myEquipmentUserId?: number
}

export async function invalidateLifecycleQueries(queryClient: QueryClient, options: LifecycleInvalidateOptions = {}) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: queryKeys.assets.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assetDetail.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.assignment.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.employeeDetail.root }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myEquipment.root }),
    queryClient.invalidateQueries({ queryKey: ['asset-timeline'] }),
    queryClient.invalidateQueries({ queryKey: ['asset-assignments-history'] }),
    queryClient.invalidateQueries({ queryKey: ['asset-audit-trail'] }),
  ]

  if (options.assetId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(options.assetId) }))
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.assetDetail.byId(options.assetId) }))
  }
  if (options.employeeId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(options.employeeId) }))
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.employeeDetail.byId(options.employeeId) }))
  }
  if (options.assignmentId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.assignments.detail(options.assignmentId) }))
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.assignment.byId(options.assignmentId) }))
  }
  if (options.myEquipmentUserId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.myEquipment.byUser(options.myEquipmentUserId) }))
  }

  await Promise.all(tasks)
}

