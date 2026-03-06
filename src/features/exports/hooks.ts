import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelExportJob, createExportJob, fetchExportJob, fetchExportJobs } from '../../api/services/exportsService'
import type { ExportCreateDto } from '../../types/exports'

export function useExportJobsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['export-jobs', params],
    queryFn: () => fetchExportJobs(params),
  })
}

export function useExportJobQuery(id?: number, polling = false) {
  return useQuery({
    queryKey: ['export-job', id],
    queryFn: () => fetchExportJob(id as number),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!polling) return false
      const status = query.state.data?.status
      if (!status) return 2200
      return ['COMPLETED', 'FAILED'].includes(status) ? false : 2200
    },
  })
}

export function useCreateExportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExportCreateDto) => createExportJob(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['export-jobs'] }),
  })
}

export function useCancelExportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelExportJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['export-jobs'] }),
  })
}
