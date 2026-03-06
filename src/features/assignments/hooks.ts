import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAssignment, fetchAssignment, returnAssignment } from '../../api/services/assignmentsService'
import type { AssignmentCreateDto, AssignmentListParams, AssignmentReturnDto } from '../../types/assignment'
import { useAssignmentsQuery as useDomainAssignmentsQuery } from '../common/domainQueries'
import { queryKeys } from '../common/queryKeys'
import { invalidateLifecycleQueries } from '../common/lifecycleInvalidation'

export function useAssignmentsQuery(params: AssignmentListParams, enabled = true) {
  return useDomainAssignmentsQuery(params, enabled)
}

export function useCreateAssignmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignmentCreateDto) => createAssignment(payload),
    onSuccess: (result, payload) =>
      invalidateLifecycleQueries(queryClient, {
        assignmentId: result.assignmentId,
        assetId: payload.assetId,
        employeeId: payload.employeeId,
      }),
  })
}

export function useReturnAssignmentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignmentReturnDto }) => returnAssignment(id, payload),
    onSuccess: (_response, variables) => invalidateLifecycleQueries(queryClient, { assignmentId: variables.id }),
  })
}

export function useAssignmentDetailQuery(id?: number) {
  return useQuery({
    queryKey: queryKeys.assignment.byId(id),
    queryFn: () => fetchAssignment(id as number),
    enabled: Boolean(id),
  })
}
