import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEmployee, deactivateEmployee, fetchEmployee, updateEmployee } from '../../api/services/employeesService'
import type { EmployeeCreateDto, EmployeeListParams, EmployeeUpdateDto } from '../../types/employee'
import { useEmployeesQuery as useDomainEmployeesQuery } from '../common/domainQueries'
import { queryKeys } from '../common/queryKeys'
import { invalidateLifecycleQueries } from '../common/lifecycleInvalidation'

export function useEmployeesQuery(params: EmployeeListParams, enabled = true) {
  return useDomainEmployeesQuery(params, enabled)
}

export function useEmployeeDetailQuery(id?: number) {
  return useQuery({
    queryKey: queryKeys.employeeDetail.byId(id),
    queryFn: () => fetchEmployee(id as number),
    enabled: Boolean(id),
  })
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeCreateDto) => createEmployee(payload),
    onSuccess: () => invalidateLifecycleQueries(queryClient),
  })
}

export function useUpdateEmployeeMutation(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EmployeeUpdateDto) => updateEmployee(id as number, payload),
    onSuccess: () => invalidateLifecycleQueries(queryClient, { employeeId: id }),
  })
}

export function useDeactivateEmployeeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deactivateEmployee(id),
    onSuccess: () => invalidateLifecycleQueries(queryClient),
  })
}
