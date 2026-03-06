import { apiClient, getParsed, postParsed } from '../client'
import { assignmentCreateResponseSchema, assignmentListSchema, assignmentSchema } from '../schemas/assignment'
import type {
  Assignment,
  AssignmentCreateDto,
  AssignmentCreateResponse,
  AssignmentListParams,
  AssignmentReturnDto,
} from '../../types/assignment'
import type { PagedResult } from '../httpTypes'

export async function fetchAssignments(params: AssignmentListParams): Promise<PagedResult<Assignment>> {
  return getParsed('/assignments', assignmentListSchema, params)
}

export async function fetchAssignment(id: number): Promise<Assignment> {
  return getParsed(`/assignments/${id}`, assignmentSchema)
}

export async function createAssignment(payload: AssignmentCreateDto): Promise<AssignmentCreateResponse> {
  return postParsed('/assignments', payload, assignmentCreateResponseSchema)
}

export async function returnAssignment(id: number, payload: AssignmentReturnDto): Promise<void> {
  await apiClient.post(`/assignments/${id}/return`, payload)
}
