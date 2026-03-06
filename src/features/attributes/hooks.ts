import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAttribute, createEnumOption, disableAttribute, disableEnumOption, fetchAttributes, fetchEnumOptions, updateAttribute } from '../../api/services/attributesService'
import type { AttributeCreateDto } from '../../types/attributes'

export function useAttributesQuery(groupId?: number) {
  return useQuery({
    queryKey: ['attributes', groupId],
    queryFn: () => fetchAttributes(groupId as number),
    enabled: Boolean(groupId),
  })
}

export function useEnumOptionsQuery(attributeId?: number) {
  return useQuery({
    queryKey: ['enum-options', attributeId],
    queryFn: () => fetchEnumOptions(attributeId as number),
    enabled: Boolean(attributeId),
  })
}

export function useCreateAttributeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AttributeCreateDto) => createAttribute(payload),
    onSuccess: (result) => queryClient.invalidateQueries({ queryKey: ['attributes', result.groupId] }),
  })
}

export function useUpdateAttributeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AttributeCreateDto> }) => updateAttribute(id, payload),
    onSuccess: (result) => queryClient.invalidateQueries({ queryKey: ['attributes', result.groupId] }),
  })
}

export function useDisableAttributeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => disableAttribute(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attributes'] }),
  })
}

export function useCreateEnumOptionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ attributeId, value }: { attributeId: number; value: string }) => createEnumOption(attributeId, value),
    onSuccess: (option) => queryClient.invalidateQueries({ queryKey: ['enum-options', option.attributeId] }),
  })
}

export function useDisableEnumOptionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (optionId: number) => disableEnumOption(optionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enum-options'] }),
  })
}
