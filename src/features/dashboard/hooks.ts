import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats } from '../../api/services/dashboardService'

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })
}
