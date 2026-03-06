import { useQuery } from '@tanstack/react-query'
import { fetchAuditEvents, fetchSystemLogs } from '../../api/services/logsService'

export function useAuditEventsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['audit-events', params],
    queryFn: () => fetchAuditEvents(params),
  })
}

export function useSystemLogsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['system-logs', params],
    queryFn: () => fetchSystemLogs(params),
  })
}

