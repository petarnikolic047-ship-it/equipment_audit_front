import { useQuery } from '@tanstack/react-query'
import { fetchAssets } from '../../api/services/assetsService'
import { fetchAssignments } from '../../api/services/assignmentsService'
import { fetchEmployees } from '../../api/services/employeesService'
import type { AssetListParams } from '../../types/asset'
import type { AssignmentListParams } from '../../types/assignment'
import type { EmployeeListParams } from '../../types/employee'
import { queryKeys } from './queryKeys'

export function useAssetsQuery(params: AssetListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assets.list(params),
    queryFn: () => fetchAssets(params),
    enabled,
  })
}

export function useEmployeesQuery(params: EmployeeListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => fetchEmployees(params),
    enabled,
  })
}

export function useAssignmentsQuery(params: AssignmentListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assignments.list(params),
    queryFn: () => fetchAssignments(params),
    enabled,
  })
}

