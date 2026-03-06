import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStocktakeAudit,
  fetchStocktakeAuditDetail,
  fetchStocktakeAudits,
  finalizeStocktake,
  reconcileStocktake,
  startStocktakeAudit,
  upsertStocktakeEntry,
} from '../../api/services/assetOpsService'
import type { StocktakeCreateDto, StocktakeEntryUpdateDto } from '../../types/assetOps'

export function useStocktakeAuditsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['stocktakes', params],
    queryFn: () => fetchStocktakeAudits(params),
  })
}

export function useStocktakeDetailQuery(auditId?: number) {
  return useQuery({
    queryKey: ['stocktake-detail', auditId],
    queryFn: () => fetchStocktakeAuditDetail(auditId as number),
    enabled: Boolean(auditId),
  })
}

export function useCreateStocktakeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StocktakeCreateDto) => createStocktakeAudit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocktakes'] })
    },
  })
}

export function useStartStocktakeMutation(auditId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => startStocktakeAudit(auditId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocktakes'] })
      queryClient.invalidateQueries({ queryKey: ['stocktake-detail', auditId] })
    },
  })
}

export function useUpsertStocktakeEntryMutation(auditId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StocktakeEntryUpdateDto) => upsertStocktakeEntry(auditId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocktake-detail', auditId] })
    },
  })
}

export function useReconcileStocktakeMutation(auditId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => reconcileStocktake(auditId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocktakes'] })
      queryClient.invalidateQueries({ queryKey: ['stocktake-detail', auditId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useFinalizeStocktakeMutation(auditId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => finalizeStocktake(auditId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocktakes'] })
      queryClient.invalidateQueries({ queryKey: ['stocktake-detail', auditId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['entity-history'] })
      queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    },
  })
}
