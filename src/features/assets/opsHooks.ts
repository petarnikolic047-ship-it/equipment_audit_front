import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeMaintenanceTicket,
  createAssetInspection,
  createMaintenanceTicket,
  fetchAssetAssignmentsHistory,
  fetchAssetAuditTrail,
  fetchAssetDocuments,
  fetchAssetInspections,
  fetchAssetMaintenance,
  fetchAssetTimeline,
  transferCustody,
} from '../../api/services/assetOpsService'
import type { InspectionCreateDto, MaintenanceCompleteDto, MaintenanceCreateDto, TransferRequest } from '../../types/assetOps'

export function useAssetTimelineQuery(assetId?: number, eventType?: string, from?: string, to?: string, enabled = true) {
  return useQuery({
    queryKey: ['asset-timeline', assetId, eventType, from, to],
    queryFn: () => fetchAssetTimeline(assetId as number, eventType, from, to),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useAssetAssignmentsHistoryQuery(assetId?: number, enabled = true) {
  return useQuery({
    queryKey: ['asset-assignments-history', assetId],
    queryFn: () => fetchAssetAssignmentsHistory(assetId as number),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useAssetInspectionsQuery(assetId?: number, enabled = true) {
  return useQuery({
    queryKey: ['asset-inspections', assetId],
    queryFn: () => fetchAssetInspections(assetId as number),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useCreateAssetInspectionMutation(assetId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InspectionCreateDto) => createAssetInspection(assetId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-inspections', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-timeline', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-audit-trail', assetId] })
    },
  })
}

export function useAssetMaintenanceQuery(assetId?: number, enabled = true) {
  return useQuery({
    queryKey: ['asset-maintenance', assetId],
    queryFn: () => fetchAssetMaintenance(assetId as number),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useCreateMaintenanceMutation(assetId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MaintenanceCreateDto) => createMaintenanceTicket(assetId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance', assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset-detail', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-timeline', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-audit-trail', assetId] })
    },
  })
}

export function useCompleteMaintenanceMutation(assetId?: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: number; payload: MaintenanceCompleteDto }) =>
      completeMaintenanceTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance', assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset-detail', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-timeline', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-audit-trail', assetId] })
    },
  })
}

export function useAssetDocumentsQuery(assetId?: number, enabled = true) {
  return useQuery({
    queryKey: ['asset-documents', assetId],
    queryFn: () => fetchAssetDocuments(assetId as number),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useAssetAuditTrailQuery(assetId?: number, enabled = true) {
  return useQuery({
    queryKey: ['asset-audit-trail', assetId],
    queryFn: () => fetchAssetAuditTrail(assetId as number),
    enabled: Boolean(assetId) && enabled,
  })
}

export function useTransferCustodyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TransferRequest) => transferCustody(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['asset-detail'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['asset-timeline'] })
      queryClient.invalidateQueries({ queryKey: ['asset-audit-trail'] })
      queryClient.invalidateQueries({ queryKey: ['asset-documents'] })
    },
  })
}
