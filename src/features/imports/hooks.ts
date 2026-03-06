import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applyImport, createImportJob, fetchImportJob, fetchImportJobs, fetchImportRows, previewImport } from '../../api/services/importsService'

export function useImportJobsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['import-jobs', params],
    queryFn: () => fetchImportJobs(params),
  })
}

export function useImportJobQuery(id?: number, polling = false) {
  return useQuery({
    queryKey: ['import-job', id],
    queryFn: () => fetchImportJob(id as number),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!polling) return false
      const status = query.state.data?.status
      if (!status) return 2200
      return ['COMPLETED', 'FAILED', 'COMPLETED_WITH_ERRORS'].includes(status) ? false : 2200
    },
  })
}

export function useImportRowsQuery(id?: number, onlyErrors = false) {
  return useQuery({
    queryKey: ['import-rows', id, onlyErrors],
    queryFn: () => fetchImportRows(id as number, onlyErrors),
    enabled: Boolean(id),
  })
}

export function useCreateImportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) => createImportJob(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['import-jobs'] }),
  })
}

export function usePreviewImportMutation() {
  return useMutation({
    mutationFn: (id: number) => previewImport(id),
  })
}

export function useApplyImportMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, key }: { id: number; key: string }) => applyImport(id, key),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['import-job', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
    },
  })
}
