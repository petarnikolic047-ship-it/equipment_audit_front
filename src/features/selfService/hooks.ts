import { useQuery } from '@tanstack/react-query'
import { fetchMyEquipment } from '../../api/services/assetOpsService'
import { queryKeys } from '../common/queryKeys'

export function useMyEquipmentQuery(userId?: number) {
  return useQuery({
    queryKey: queryKeys.myEquipment.byUser(userId),
    queryFn: () => fetchMyEquipment(userId),
  })
}
