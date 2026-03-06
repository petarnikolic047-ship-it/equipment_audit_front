import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createReference,
  disableReference,
  fetchCategories,
  fetchGroups,
  fetchLocations,
  fetchPositions,
  fetchReturnReasons,
  updateReference,
} from '../../api/services/referenceService'
import { categorySchema, groupSchema, locationSchema, positionSchema, returnReasonSchema } from '../../api/schemas/reference'
import type { ReferenceCreateDto } from '../../types/reference'

export function useReferenceDataQuery() {
  return {
    groups: useQuery({ queryKey: ['reference-groups'], queryFn: fetchGroups }),
    categories: useQuery({ queryKey: ['reference-categories'], queryFn: fetchCategories }),
    locations: useQuery({ queryKey: ['reference-locations'], queryFn: fetchLocations }),
    positions: useQuery({ queryKey: ['reference-positions'], queryFn: fetchPositions }),
    returnReasons: useQuery({ queryKey: ['reference-return-reasons'], queryFn: fetchReturnReasons }),
  }
}

export function useCreateReferenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload: ReferenceCreateDto }) => {
      if (endpoint.includes('categories')) return createReference(endpoint, payload, categorySchema)
      if (endpoint.includes('locations')) return createReference(endpoint, payload, locationSchema)
      if (endpoint.includes('positions')) return createReference(endpoint, payload, positionSchema)
      if (endpoint.includes('return-reasons')) return createReference(endpoint, payload, returnReasonSchema)
      return createReference(endpoint, payload, groupSchema)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-groups'] })
      queryClient.invalidateQueries({ queryKey: ['reference-categories'] })
      queryClient.invalidateQueries({ queryKey: ['reference-locations'] })
      queryClient.invalidateQueries({ queryKey: ['reference-positions'] })
      queryClient.invalidateQueries({ queryKey: ['reference-return-reasons'] })
    },
  })
}

export function useUpdateReferenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ endpoint, id, payload }: { endpoint: string; id: number; payload: ReferenceCreateDto }) => {
      if (endpoint.includes('categories')) return updateReference(endpoint, id, payload, categorySchema)
      if (endpoint.includes('locations')) return updateReference(endpoint, id, payload, locationSchema)
      if (endpoint.includes('positions')) return updateReference(endpoint, id, payload, positionSchema)
      if (endpoint.includes('return-reasons')) return updateReference(endpoint, id, payload, returnReasonSchema)
      return updateReference(endpoint, id, payload, groupSchema)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-groups'] })
      queryClient.invalidateQueries({ queryKey: ['reference-categories'] })
      queryClient.invalidateQueries({ queryKey: ['reference-locations'] })
      queryClient.invalidateQueries({ queryKey: ['reference-positions'] })
      queryClient.invalidateQueries({ queryKey: ['reference-return-reasons'] })
    },
  })
}

export function useDisableReferenceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ endpoint, id }: { endpoint: string; id: number }) => disableReference(endpoint, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-groups'] })
      queryClient.invalidateQueries({ queryKey: ['reference-categories'] })
      queryClient.invalidateQueries({ queryKey: ['reference-locations'] })
      queryClient.invalidateQueries({ queryKey: ['reference-positions'] })
      queryClient.invalidateQueries({ queryKey: ['reference-return-reasons'] })
    },
  })
}
