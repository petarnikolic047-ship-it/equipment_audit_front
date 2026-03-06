import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAsset, disableAsset, fetchAssetDetail, updateAsset } from '../../api/services/assetsService'
import type { AssetCreateDto, AssetListParams, AssetUpdateDto } from '../../types/asset'
import { useAssetsQuery as useDomainAssetsQuery } from '../common/domainQueries'
import { queryKeys } from '../common/queryKeys'
import { invalidateLifecycleQueries } from '../common/lifecycleInvalidation'

export function useAssetsQuery(params: AssetListParams, enabled = true) {
  return useDomainAssetsQuery(params, enabled)
}

export function useAssetDetailQuery(id?: number) {
  return useQuery({
    queryKey: queryKeys.assetDetail.byId(id),
    queryFn: () => fetchAssetDetail(id as number),
    enabled: Boolean(id),
  })
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssetCreateDto) => createAsset(payload),
    onSuccess: () => invalidateLifecycleQueries(queryClient),
  })
}

export function useUpdateAssetMutation(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssetUpdateDto) => updateAsset(id as number, payload),
    onSuccess: () => invalidateLifecycleQueries(queryClient, { assetId: id }),
  })
}

export function useDisableAssetMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => disableAsset(id, reason),
    onSuccess: () => invalidateLifecycleQueries(queryClient),
  })
}
