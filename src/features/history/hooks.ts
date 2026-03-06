import { useQuery } from '@tanstack/react-query'
import { fetchEntityHistory } from '../../api/services/historyService'

export function useEntityHistoryQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['entity-history', params],
    queryFn: () => fetchEntityHistory(params),
  })
}
