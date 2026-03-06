import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { Button } from '../components/primitives/Button'
import { Select } from '../components/primitives/Select'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Drawer } from '../components/primitives/Drawer'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Textarea } from '../components/primitives/Textarea'
import { Card } from '../components/primitives/Card'
import { useTableState } from '../utils/useTableState'
import { useMediaQuery } from '../utils/useMediaQuery'
import { useCreateAssetMutation, useAssetDetailQuery, useAssetsQuery, useDisableAssetMutation, useUpdateAssetMutation } from '../features/assets/hooks'
import { useReferenceDataQuery } from '../features/reference/hooks'
import { useAttributesQuery } from '../features/attributes/hooks'
import { fetchEnumOptions } from '../api/services/attributesService'
import { useEmployeesQuery } from '../features/employees/hooks'
import { DynamicAttributesForm } from '../features/assets/DynamicAttributesForm'
import type { Asset, AssetAttributeInput } from '../types/asset'
import type { AssetAttributeValue, AttributeDefinition, EnumOption } from '../types/attributes'
import type { MaintenanceTicket } from '../types/assetOps'
import { useToast } from '../components/patterns/useToast'
import { useAssignmentDetailQuery } from '../features/assignments/hooks'
import { getDownloadLink } from '../api/services/filesService'
import { fetchAssetDetail } from '../api/services/assetsService'
import { AssignModal } from '../features/assignments/components/AssignModal'
import { ReturnModal } from '../features/assignments/components/ReturnModal'
import {
  useAssetAssignmentsHistoryQuery,
  useAssetAuditTrailQuery,
  useAssetDocumentsQuery,
  useAssetInspectionsQuery,
  useAssetMaintenanceQuery,
  useAssetTimelineQuery,
  useCompleteMaintenanceMutation,
  useCreateAssetInspectionMutation,
  useCreateMaintenanceMutation,
  useTransferCustodyMutation,
} from '../features/assets/opsHooks'
import { AssetDetailWorkspace } from '../features/assets/components/AssetDetailWorkspace'
import type { InlineDetailTabItem } from '../components/primitives/InlineDetailTabs'
import { DESKTOP_MEDIA_QUERY } from '../constants/layout'

interface AssetFormValues {
  name: string
  categoryId: number
  locationId: number | null
  serialNumber: string | null
  purchaseDate: string | null
  activationDate: string | null
  purchaseValue: number | null
  comment: string | null
}

interface AssetNavigationState {
  focusRowId?: number
  centerRow?: boolean
}

const detailTabs: InlineDetailTabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'inspections', label: 'Condition & Inspections' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'documents', label: 'Documents' },
  { id: 'audit', label: 'Audit Trail' },
]

const defaultTabId = 'overview'
const validTabIds = new Set(detailTabs.map((item) => item.id))

function resolveTabId(tabId: string | null) {
  if (!tabId) return defaultTabId
  return validTabIds.has(tabId) ? tabId : defaultTabId
}

function countTypedValues(value: AssetAttributeInput) {
  return [value.valueInteger, value.valueBoolean, value.valueString, value.valueEnumOptionId, value.valueEmployeeId].filter(
    (item) => item !== undefined && item !== null && item !== '',
  ).length
}

function mapAttributeValueToInput(item: AssetAttributeValue): AssetAttributeInput {
  return {
    attributeId: item.attributeId,
    valueInteger: item.valueInteger ?? undefined,
    valueBoolean: item.valueBoolean ?? undefined,
    valueString: item.valueString ?? undefined,
    valueEnumOptionId: item.valueEnumOptionId ?? undefined,
    valueEmployeeId: item.valueEmployeeId ?? undefined,
  }
}

function resolveAttributeValue(item: AssetAttributeValue, enums: Map<number, EnumOption>, users: Map<number, string>) {
  if (item.valueInteger !== null) return String(item.valueInteger)
  if (item.valueBoolean !== null) return item.valueBoolean ? 'Yes' : 'No'
  if (item.valueString) return item.valueString
  if (item.valueEnumOptionId !== null) return enums.get(item.valueEnumOptionId)?.value ?? `Option #${item.valueEnumOptionId}`
  if (item.valueEmployeeId !== null) return users.get(item.valueEmployeeId) ?? `Employee #${item.valueEmployeeId}`
  return '-'
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const isFullMode = Boolean(useMatch('/assets/:assetId/full'))
  const params = useParams<{ assetId: string }>()
  const selectedAssetId = params.assetId ? Number(params.assetId) : undefined
  const [expandedAssetIds, setExpandedAssetIds] = useState<number[]>(() => (selectedAssetId ? [selectedAssetId] : []))
  const table = useTableState()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const { showToast } = useToast()

  const rawTabId = searchParams.get('tab')
  const activeTab = resolveTabId(rawTabId)
  const searchString = searchParams.toString()
  const navigationState = location.state as AssetNavigationState | null
  const shouldCenterSelectedRow = Boolean(selectedAssetId && navigationState?.centerRow && navigationState.focusRowId === selectedAssetId)

  const shouldFocusExpandedHeaderRef = useRef(false)
  const focusRowAfterCollapseRef = useRef<number | null>(null)
  const detailHeaderRef = useRef<HTMLDivElement | null>(null)
  const lastSelectedAssetIdRef = useRef<number | undefined>(selectedAssetId)

  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [seenFilter, setSeenFilter] = useState('')
  const [timelineTypeFilter, setTimelineTypeFilter] = useState('')
  const [timelineFromDate, setTimelineFromDate] = useState('')
  const [timelineToDate, setTimelineToDate] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignAssetId, setAssignAssetId] = useState<number | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const [maintenanceCompleteOpen, setMaintenanceCompleteOpen] = useState(false)

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [dynamicAttributes, setDynamicAttributes] = useState<AssetAttributeInput[]>([])
  const [transferToEmployeeId, setTransferToEmployeeId] = useState<number | null>(null)
  const [transferToLocationId, setTransferToLocationId] = useState<number | null>(null)
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [transferNotes, setTransferNotes] = useState('')
  const [transferEvidenceFileName, setTransferEvidenceFileName] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [inspectionGrade, setInspectionGrade] = useState('')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketExpected, setTicketExpected] = useState('')
  const [ticketNotes, setTicketNotes] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)
  const [completeCost, setCompleteCost] = useState('')
  const [completeDowntimeHours, setCompleteDowntimeHours] = useState('')
  const [completeConditionGrade, setCompleteConditionGrade] = useState('')
  const [completeReportFileName, setCompleteReportFileName] = useState('')
  const [completeNotes, setCompleteNotes] = useState('')
  const [disableReason, setDisableReason] = useState('')
  const [selectedAuditHistoryId, setSelectedAuditHistoryId] = useState<number | null>(null)

  const reference = useReferenceDataQuery()
  const employees = useEmployeesQuery({ page: 1, pageSize: 500, active: true })
  const assets = useAssetsQuery({
    page: table.page,
    pageSize: table.pageSize,
    search: table.search || undefined,
    status: statusFilter ? (statusFilter as Asset['status']) : undefined,
    categoryId: categoryFilter ? Number(categoryFilter) : undefined,
    locationId: locationFilter ? Number(locationFilter) : undefined,
    assignedToEmployeeId: assignedFilter ? Number(assignedFilter) : undefined,
    seenInLastAudit: seenFilter ? seenFilter === 'true' : undefined,
    active: activeFilter ? activeFilter === 'true' : undefined,
  })
  const availableAssetIds = useMemo(() => new Set((assets.data?.items ?? []).map((item) => item.id)), [assets.data?.items])
  const expandedVisibleAssetIds = useMemo(() => {
    const next = expandedAssetIds.filter((id) => availableAssetIds.has(id))
    if (selectedAssetId && availableAssetIds.has(selectedAssetId) && !next.includes(selectedAssetId)) {
      next.push(selectedAssetId)
    }
    return next
  }, [availableAssetIds, expandedAssetIds, selectedAssetId])

  const selectedFromList = assets.data?.items.find((item) => item.id === selectedAssetId) ?? null
  const detail = useAssetDetailQuery(selectedAssetId)
  const asset = detail.data?.asset ?? selectedFromList ?? null
  const currentAssignmentId = detail.data?.currentAssignmentId ?? null
  const assignmentDetail = useAssignmentDetailQuery(currentAssignmentId ?? undefined)

  const attributes = useAttributesQuery(asset?.groupId)
  const timelineFrom = timelineFromDate ? `${timelineFromDate}T00:00:00.000Z` : undefined
  const timelineTo = timelineToDate ? `${timelineToDate}T23:59:59.999Z` : undefined
  const timeline = useAssetTimelineQuery(asset?.id, timelineTypeFilter || undefined, timelineFrom, timelineTo, activeTab === 'timeline')
  const assignmentHistory = useAssetAssignmentsHistoryQuery(asset?.id, activeTab === 'assignments')
  const inspections = useAssetInspectionsQuery(asset?.id, activeTab === 'inspections')
  const maintenance = useAssetMaintenanceQuery(asset?.id, activeTab === 'maintenance')
  const documents = useAssetDocumentsQuery(asset?.id, activeTab === 'documents')
  const auditTrail = useAssetAuditTrailQuery(asset?.id, activeTab === 'audit')

  const createAsset = useCreateAssetMutation()
  const updateAsset = useUpdateAssetMutation(editingAsset?.id)
  const disableAsset = useDisableAssetMutation()
  const createInspection = useCreateAssetInspectionMutation(asset?.id)
  const createMaintenance = useCreateMaintenanceMutation(asset?.id)
  const completeMaintenance = useCompleteMaintenanceMutation(asset?.id)
  const transferCustody = useTransferCustodyMutation()

  const formDefaults = useMemo<AssetFormValues>(
    () => ({
      name: editingAsset?.name ?? '',
      categoryId: editingAsset?.categoryId ?? (reference.categories.data?.[0]?.id ?? 1),
      locationId: editingAsset?.locationId ?? null,
      serialNumber: editingAsset?.serialNumber ?? null,
      purchaseDate: editingAsset?.purchaseDate ?? null,
      activationDate: editingAsset?.activationDate ?? null,
      purchaseValue: editingAsset?.purchaseValue ?? null,
      comment: editingAsset?.comment ?? null,
    }),
    [editingAsset, reference.categories.data],
  )

  const form = useForm<AssetFormValues>({ defaultValues: formDefaults })
  useEffect(() => {
    form.reset(formDefaults)
  }, [form, formDefaults])

  useEffect(() => {
    if (!rawTabId) return
    if (validTabIds.has(rawTabId)) return
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('tab')
      return next
    }, { replace: true })
  }, [rawTabId, setSearchParams])

  useEffect(() => {
    if (!isDesktop || isFullMode || !selectedAssetId) return
    if (assets.isLoading || assets.isFetching || !assets.data) return

    if (availableAssetIds.has(selectedAssetId)) return

    const fallbackId = expandedVisibleAssetIds[expandedVisibleAssetIds.length - 1]
    navigate(
      {
        pathname: fallbackId ? `/assets/${fallbackId}` : '/assets',
        search: searchString ? `?${searchString}` : '',
      },
      { replace: true },
    )
  }, [assets.data, assets.isFetching, assets.isLoading, availableAssetIds, expandedVisibleAssetIds, isDesktop, isFullMode, navigate, searchString, selectedAssetId])

  useEffect(() => {
    let recenterTimer: number | null = null

    if (!isDesktop || isFullMode) {
      lastSelectedAssetIdRef.current = selectedAssetId
      return () => {
        if (recenterTimer !== null) window.clearTimeout(recenterTimer)
      }
    }

    const previousSelectedId = lastSelectedAssetIdRef.current
    const hasChanged = selectedAssetId !== previousSelectedId

    if (selectedAssetId && hasChanged) {
      const rowNode = document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${selectedAssetId}"]`)
      if (rowNode) {
        rowNode.scrollIntoView({ block: shouldCenterSelectedRow ? 'center' : 'nearest', behavior: 'smooth' })
        if (shouldCenterSelectedRow) {
          recenterTimer = window.setTimeout(() => {
            rowNode.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }, 260)
        }
      }
      if (shouldFocusExpandedHeaderRef.current) {
        requestAnimationFrame(() => detailHeaderRef.current?.focus())
        shouldFocusExpandedHeaderRef.current = false
      }
    }

    if (!selectedAssetId && focusRowAfterCollapseRef.current !== null) {
      const rowKey = focusRowAfterCollapseRef.current
      focusRowAfterCollapseRef.current = null
      requestAnimationFrame(() => {
        document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${rowKey}"]`)?.focus()
      })
    }

    lastSelectedAssetIdRef.current = selectedAssetId
    return () => {
      if (recenterTimer !== null) window.clearTimeout(recenterTimer)
    }
  }, [isDesktop, isFullMode, selectedAssetId, shouldCenterSelectedRow])

  const anyModalOpen = formOpen || assignOpen || returnOpen || disableOpen || transferOpen || inspectionOpen || maintenanceOpen || maintenanceCompleteOpen

  useEffect(() => {
    if (!isDesktop || isFullMode || !selectedAssetId || anyModalOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.closest('[role="dialog"]')) return

      focusRowAfterCollapseRef.current = selectedAssetId
      setExpandedAssetIds((current) => current.filter((id) => id !== selectedAssetId))
      navigate({ pathname: '/assets', search: searchString ? `?${searchString}` : '' })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [anyModalOpen, isDesktop, isFullMode, navigate, searchString, selectedAssetId])

  const watchedCategoryId = useWatch({ control: form.control, name: 'categoryId' })
  const watchedLocationId = useWatch({ control: form.control, name: 'locationId' })
  const watchedPurchaseValue = useWatch({ control: form.control, name: 'purchaseValue' })
  const formCategory = reference.categories.data?.find((item) => item.id === watchedCategoryId)
  const formAttributes = useAttributesQuery(formCategory?.groupId)

  const enumAttributeIds = useMemo(() => {
    const ids = new Set<number>()
    ;(formAttributes.data ?? []).forEach((item) => item.valueType === 'ENUM' && ids.add(item.id))
    ;(attributes.data ?? []).forEach((item) => item.valueType === 'ENUM' && ids.add(item.id))
    return [...ids]
  }, [formAttributes.data, attributes.data])

  const enumOptions = useQuery({
    queryKey: ['enum-options-assets', enumAttributeIds.join(',')],
    enabled: enumAttributeIds.length > 0,
    queryFn: async () => (await Promise.all(enumAttributeIds.map((id) => fetchEnumOptions(id)))).flat(),
  })

  const defsById = useMemo(() => {
    const map = new Map<number, AttributeDefinition>()
    ;(attributes.data ?? []).forEach((item) => map.set(item.id, item))
    return map
  }, [attributes.data])

  const enumById = useMemo(() => {
    const map = new Map<number, EnumOption>()
    ;(enumOptions.data ?? []).forEach((item) => map.set(item.id, item))
    return map
  }, [enumOptions.data])

  const usersById = useMemo(() => {
    const map = new Map<number, string>()
    ;(employees.data?.items ?? []).forEach((item) => map.set(item.id, `${item.firstName} ${item.lastName}`))
    return map
  }, [employees.data?.items])

  const selectedHistoryItem = (() => {
    if (!auditTrail.data?.history?.length) return null
    const effectiveId = selectedAuditHistoryId ?? auditTrail.data.history[0].id
    return auditTrail.data.history.find((item) => item.id === effectiveId) ?? auditTrail.data.history[0]
  })()

  const assetDetailTabs = useMemo<InlineDetailTabItem[]>(
    () =>
      detailTabs.map((tab) => {
        if (tab.id === 'assignments') return { ...tab, badgeCount: assignmentHistory.data?.length ?? 0 }
        if (tab.id === 'maintenance') return { ...tab, badgeCount: maintenance.data?.length ?? 0 }
        if (tab.id === 'documents') return { ...tab, badgeCount: documents.data?.length ?? 0 }
        return tab
      }),
    [assignmentHistory.data?.length, documents.data?.length, maintenance.data?.length],
  )

  const effectiveStatus = useMemo<Asset['status'] | null>(() => {
    if (!asset) return null
    if (asset.status === 'IN_STOCK' && currentAssignmentId) return 'ASSIGNED'
    return asset.status
  }, [asset, currentAssignmentId])
  const statusMismatch = Boolean(asset && asset.status === 'IN_STOCK' && currentAssignmentId)
  const canAssign = effectiveStatus === 'IN_STOCK'
  const canReturn = Boolean(currentAssignmentId)
  const canTransfer = Boolean(currentAssignmentId)
  const canOpenMaintenance = effectiveStatus !== 'DISABLED' && !currentAssignmentId

  const setActiveTab = (tabId: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (tabId === defaultTabId) next.delete('tab')
      else next.set('tab', tabId)
      return next
    }, { replace: true })
  }

  const resetAssetFilters = () => {
    table.reset()
    setStatusFilter('')
    setCategoryFilter('')
    setLocationFilter('')
    setActiveFilter('true')
    setAssignedFilter('')
    setSeenFilter('')
  }

  const openCreateAsset = () => {
    setEditingAsset(null)
    setDynamicAttributes([])
    setFormOpen(true)
  }

  const navigateToAsset = (assetId: number, full = false) => {
    navigate({
      pathname: full ? `/assets/${assetId}/full` : `/assets/${assetId}`,
      search: searchString ? `?${searchString}` : '',
    })
  }

  const collapseAssetRow = (assetId: number) => {
    setExpandedAssetIds((current) => current.filter((id) => id !== assetId))
    if (selectedAssetId !== assetId) return

    const remainingExpandedIds = expandedVisibleAssetIds.filter((id) => id !== assetId)
    const fallbackId = remainingExpandedIds[remainingExpandedIds.length - 1]
    if (fallbackId) {
      navigateToAsset(fallbackId, false)
      return
    }
    navigate({ pathname: '/assets', search: searchString ? `?${searchString}` : '' })
  }

  const collapseSelection = () => {
    if (selectedAssetId) setExpandedAssetIds((current) => current.filter((id) => id !== selectedAssetId))
    navigate({ pathname: '/assets', search: searchString ? `?${searchString}` : '' })
  }

  const handleRowToggle = (row: Asset, context?: { source: 'pointer' | 'keyboard'; rowKey: string }) => {
    const isExpanded = expandedVisibleAssetIds.includes(row.id)
    if (context?.source === 'keyboard') {
      if (isExpanded) {
        focusRowAfterCollapseRef.current = row.id
      } else {
        shouldFocusExpandedHeaderRef.current = true
      }
    } else {
      shouldFocusExpandedHeaderRef.current = false
    }

    if (isExpanded) {
      collapseAssetRow(row.id)
      return
    }

    setExpandedAssetIds((current) => (current.includes(row.id) ? current : [...current, row.id]))
    navigateToAsset(row.id, false)
  }

  const saveAsset = form.handleSubmit(async (values) => {
    const enabledDefs = (formAttributes.data ?? []).filter((item) => item.enabled)
    const enabledIds = new Set(enabledDefs.map((item) => item.id))
    const attrs = dynamicAttributes
      .filter((item) => enabledIds.has(item.attributeId))
      .map((item) => ({ ...item, valueString: item.valueString?.trim() || undefined }))
      .filter((item) => countTypedValues(item) > 0)

    for (const item of attrs) {
      if (countTypedValues(item) !== 1) return showToast('Exactly one typed value is required per attribute.', 'error')
    }
    for (const def of enabledDefs.filter((item) => item.required)) {
      if (!attrs.find((item) => item.attributeId === def.id)) return showToast(`Missing required attribute: ${def.label}`, 'error')
    }

    try {
      if (editingAsset) {
        await updateAsset.mutateAsync({ ...values, attributes: attrs })
        showToast('Asset updated.', 'success')
      } else {
        const created = await createAsset.mutateAsync({ ...values, attributes: attrs })
        showToast(`Asset created (${created.inventoryNumber}).`, 'success')
        navigateToAsset(created.id)
      }
      setFormOpen(false)
      setEditingAsset(null)
    } catch (error) {
      showToast((error as { message?: string }).message ?? 'Save failed', 'error')
    }
  })

  const openEdit = async (item: Asset) => {
    setEditingAsset(item)
    setFormOpen(true)
    navigateToAsset(item.id)
    try {
      const current = await queryClient.fetchQuery({ queryKey: ['asset-detail', item.id], queryFn: () => fetchAssetDetail(item.id) })
      setDynamicAttributes(current.attributes.map(mapAttributeValueToInput))
    } catch {
      setDynamicAttributes([])
    }
  }

  const columns: DataTableColumn<Asset>[] = [
    { key: 'inventoryNumber', label: 'Inventory Number', render: (row) => row.inventoryNumber },
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'category', label: 'Category', render: (row) => row.categoryName },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'location', label: 'Location', render: (row) => row.locationName ?? '-' },
    { key: 'seen', label: 'Last Seen', render: (row) => row.lastSeenAuditAt ? new Date(row.lastSeenAuditAt).toLocaleString() : '-' },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation()
              openEdit(row)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const renderWorkspace = (
    workspaceAsset: Asset,
    mode: 'inline' | 'full' | 'mobile',
    isSelectedRow = false,
    onInlineClose?: () => void,
  ) => {
    const workspaceCanAssign = isSelectedRow ? canAssign : workspaceAsset.status === 'IN_STOCK'
    const workspaceCanReturn = isSelectedRow ? canReturn : false
    const workspaceCanTransfer = isSelectedRow ? canTransfer : false
    const workspaceCanOpenMaintenance = isSelectedRow
      ? canOpenMaintenance
      : workspaceAsset.status !== 'DISABLED' && workspaceAsset.status !== 'ASSIGNED'

    return (
      <AssetDetailWorkspace
        asset={workspaceAsset}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabIdBase={`asset-${workspaceAsset.id}`}
        tabs={assetDetailTabs}
        isDesktop={isDesktop}
        isFullMode={mode === 'full'}
        isOpen={mode !== 'inline' || expandedVisibleAssetIds.includes(workspaceAsset.id)}
        headerFocusRef={detailHeaderRef}
        onClose={mode === 'inline' ? onInlineClose : mode === 'mobile' ? collapseSelection : undefined}
        onBackToList={mode === 'full' ? () => navigateToAsset(workspaceAsset.id) : undefined}
        statusMismatch={isSelectedRow ? statusMismatch : false}
        effectiveStatus={isSelectedRow ? effectiveStatus ?? workspaceAsset.status : workspaceAsset.status}
        canAssign={workspaceCanAssign}
        canReturn={workspaceCanReturn}
        canTransfer={workspaceCanTransfer}
        canOpenMaintenance={workspaceCanOpenMaintenance}
        onAssign={() => {
          setAssignAssetId(workspaceAsset.id)
          setAssignOpen(true)
        }}
        onReturn={() => setReturnOpen(true)}
        onTransfer={() => setTransferOpen(true)}
        onOpenMaintenance={() => setMaintenanceOpen(true)}
        onDeactivate={() => {
          setDisableReason('')
          setDisableOpen(true)
        }}
        currentAssignment={isSelectedRow ? assignmentDetail.data ?? null : null}
        onOpenAssignment={(assignmentId) => navigate(`/assignments/${assignmentId}`)}
        onDownloadRevers={async (fileId) => {
          const url = await getDownloadLink(fileId)
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
        attributes={isSelectedRow ? detail.data?.attributes ?? [] : []}
        defsById={defsById}
        enumById={enumById}
        usersById={usersById}
        resolveAttributeValue={resolveAttributeValue}
        timelineRows={isSelectedRow ? timeline.data ?? [] : []}
        timelineTypeFilter={timelineTypeFilter}
        timelineFromDate={timelineFromDate}
        timelineToDate={timelineToDate}
        onTimelineTypeFilterChange={setTimelineTypeFilter}
        onTimelineFromDateChange={setTimelineFromDate}
        onTimelineToDateChange={setTimelineToDate}
        assignmentHistory={isSelectedRow ? assignmentHistory.data ?? [] : []}
        inspections={isSelectedRow ? inspections.data ?? [] : []}
        maintenanceTickets={isSelectedRow ? maintenance.data ?? [] : []}
        documents={isSelectedRow ? documents.data ?? [] : []}
        auditTrail={isSelectedRow ? auditTrail.data : undefined}
        selectedHistoryItem={isSelectedRow ? selectedHistoryItem : null}
        onSelectHistoryItem={setSelectedAuditHistoryId}
        onRecordInspection={() => setInspectionOpen(true)}
        onOpenMaintenanceTicket={() => setMaintenanceOpen(true)}
        onCompleteMaintenanceTicket={(ticket) => {
          setSelectedTicket(ticket)
          setCompleteNotes('')
          setCompleteCost('')
          setCompleteDowntimeHours('')
          setCompleteConditionGrade('')
          setCompleteReportFileName('')
          setMaintenanceCompleteOpen(true)
        }}
        onDownloadMaintenanceReport={async (fileId) => {
          const url = await getDownloadLink(fileId)
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
        onDownloadDocument={async (fileId) => {
          const url = await getDownloadLink(fileId)
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
      />
    )
  }

  return (
    <>
      {isFullMode ? (
        asset ? (
          renderWorkspace(asset, 'full', true)
        ) : (
          <Card>
            <p className="text-sm text-slate-400">Asset not found.</p>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <FilterBar
            searchValue={table.search}
            onSearchChange={table.setSearch}
            onReset={resetAssetFilters}
            showResetButton={false}
            filtersClassName="xl:grid-cols-6"
          >
            <FormField label="Category">
              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All categories</option>
                {reference.categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_STOCK">IN_STOCK</option>
                <option value="UNDER_SERVICE">UNDER SERVICE</option>
                <option value="DISABLED">DISABLED</option>
              </Select>
            </FormField>
            <FormField label="Location">
              <Select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                <option value="">All locations</option>
                {reference.locations.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Record State">
              <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
                <option value="">All records</option>
              </Select>
            </FormField>
            <FormField label="Custodian">
              <Select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value)}>
                <option value="">Any custodian</option>
                {employees.data?.items.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
              </Select>
            </FormField>
            <FormField label="Seen In Audit">
              <Select value={seenFilter} onChange={(event) => setSeenFilter(event.target.value)}>
                <option value="">All</option>
                <option value="true">Seen</option>
                <option value="false">Not seen</option>
              </Select>
            </FormField>
          </FilterBar>

          <DataTable
            title="Assets"
            actions={
              <>
                <Button variant="primary" onClick={openCreateAsset}>
                  Create Asset
                </Button>
                <Button onClick={resetAssetFilters}>Reset</Button>
              </>
            }
            columns={columns}
            rows={assets.data?.items ?? []}
            loading={assets.isLoading}
            page={table.page}
            pageSize={table.pageSize}
            total={assets.data?.total ?? 0}
            onPageChange={table.setPage}
            rowKey={(row) => row.id}
            onRowClick={handleRowToggle}
            isRowActive={(row) => row.id === selectedAssetId}
            isRowExpanded={(row) => Boolean(isDesktop && expandedVisibleAssetIds.includes(row.id))}
            renderExpandedContent={(row) =>
              (
                <div className="px-4 py-3">
                  {renderWorkspace(row, 'inline', row.id === selectedAssetId, () => collapseAssetRow(row.id))}
                </div>
              )
            }
            expandedRowClassName="bg-transparent"
            tableBodyClassName={isDesktop ? 'max-h-none overflow-visible' : undefined}
            emptyMessage="No assets match the current filters. Create an asset to start assignment workflows."
          />
        </div>
      )}

      <Drawer open={!isDesktop && !isFullMode && Boolean(asset)} title={asset?.name ?? 'Asset'} onClose={collapseSelection}>
        {asset ? renderWorkspace(asset, 'mobile', true) : null}
      </Drawer>

      <Drawer open={formOpen} title={editingAsset ? 'Edit Asset' : 'Create Asset'} onClose={() => setFormOpen(false)}>
        <form className="space-y-3" onSubmit={saveAsset}>
          <FormField label="Name"><Input {...form.register('name', { required: true })} /></FormField>
          <FormField label="Category"><Select value={watchedCategoryId ?? ''} onChange={(event) => form.setValue('categoryId', Number(event.target.value))}>{reference.categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormField>
          <FormField label="Location"><Select value={watchedLocationId ?? ''} onChange={(event) => form.setValue('locationId', event.target.value ? Number(event.target.value) : null)}><option value="">No location</option>{reference.locations.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormField>
          <FormField label="Serial Number"><Input {...form.register('serialNumber')} /></FormField>
          <FormField label="Purchase Date"><Input type="date" {...form.register('purchaseDate')} /></FormField>
          <FormField label="Activation Date"><Input type="date" {...form.register('activationDate')} /></FormField>
          <FormField label="Purchase Value"><Input type="number" value={watchedPurchaseValue ?? ''} onChange={(event) => form.setValue('purchaseValue', event.target.value === '' ? null : Number(event.target.value))} /></FormField>
          <FormField label="Comment"><Textarea rows={3} {...form.register('comment')} /></FormField>
          <Card title="Dynamic Attributes"><DynamicAttributesForm definitions={formAttributes.data ?? []} enumOptions={enumOptions.data ?? []} employees={employees.data?.items ?? []} values={dynamicAttributes} onChange={setDynamicAttributes} /></Card>
          <div className="flex justify-end gap-2"><Button onClick={() => setFormOpen(false)}>Cancel</Button><Button variant="primary" type="submit">Save</Button></div>
        </form>
      </Drawer>

      <AssignModal
        key={`assign-${assignOpen ? 'open' : 'closed'}-${assignAssetId ?? asset?.id ?? 'none'}`}
        open={assignOpen}
        defaultAssetId={assignAssetId ?? asset?.id ?? null}
        lockAsset={Boolean(assignAssetId ?? asset?.id)}
        onClose={() => {
          setAssignOpen(false)
          setAssignAssetId(null)
        }}
        onAssigned={() => {
          showToast('Assignment created successfully.', 'success')
          setAssignOpen(false)
          setAssignAssetId(null)
        }}
      />

      <ReturnModal
        open={returnOpen}
        assignmentId={currentAssignmentId ?? undefined}
        onClose={() => setReturnOpen(false)}
        onReturned={() => {
          showToast('Assignment returned successfully.', 'success')
          setReturnOpen(false)
        }}
      />

      <Dialog
        open={transferOpen}
        title="Custody Transfer"
        onClose={() => {
          setTransferOpen(false)
          setTransferToEmployeeId(null)
          setTransferToLocationId(null)
          setTransferConfirmed(false)
          setTransferNotes('')
          setTransferEvidenceFileName('')
        }}
      >
        <div className="space-y-3">
          <FormField label="To Employee">
            <Select value={transferToEmployeeId ?? ''} onChange={(event) => setTransferToEmployeeId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">No employee transfer</option>
              {employees.data?.items.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
            </Select>
          </FormField>
          <FormField label="To Location">
            <Select value={transferToLocationId ?? ''} onChange={(event) => setTransferToLocationId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">No location transfer</option>
              {reference.locations.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Transfer Reason / Note">
            <Textarea rows={3} value={transferNotes} onChange={(event) => setTransferNotes(event.target.value)} />
          </FormField>
          <FormField label="Evidence File Name (optional)">
            <Input value={transferEvidenceFileName} onChange={(event) => setTransferEvidenceFileName(event.target.value)} placeholder="handover-proof.jpg" />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={transferConfirmed} onChange={(event) => setTransferConfirmed(event.target.checked)} />
            Transfer confirmed
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!asset) return
                if (!transferNotes.trim()) {
                  showToast('Transfer note is required for manual override.', 'error')
                  return
                }
                try {
                  await transferCustody.mutateAsync({
                    assetIds: [asset.id],
                    fromEmployeeId: assignmentDetail.data?.employeeId ?? null,
                    toEmployeeId: transferToEmployeeId,
                    fromLocationId: asset.locationId,
                    toLocationId: transferToLocationId,
                    confirmationChecked: transferConfirmed,
                    notes: transferNotes.trim(),
                    evidenceFileName: transferEvidenceFileName.trim() || null,
                  })
                  setTransferOpen(false)
                  setTransferToEmployeeId(null)
                  setTransferToLocationId(null)
                  setTransferConfirmed(false)
                  setTransferNotes('')
                  setTransferEvidenceFileName('')
                  showToast('Transfer completed.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Transfer failed', 'error')
                }
              }}
            >
              Transfer
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={inspectionOpen} title="Record Inspection" onClose={() => setInspectionOpen(false)}>
        <div className="space-y-3">
          <FormField label="Date"><Input type="date" value={inspectionDate} onChange={(event) => setInspectionDate(event.target.value)} /></FormField>
          <FormField label="Grade"><Select value={inspectionGrade} onChange={(event) => setInspectionGrade(event.target.value)}><option value="">Select grade</option><option value="EXCELLENT">EXCELLENT</option><option value="GOOD">GOOD</option><option value="FAIR">FAIR</option><option value="POOR">POOR</option></Select></FormField>
          <FormField label="Notes"><Textarea rows={3} value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} /></FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setInspectionOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!asset || !inspectionDate || !inspectionGrade) return
                try {
                  await createInspection.mutateAsync({
                    conditionGrade: inspectionGrade as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
                    findings: inspectionNotes || null,
                    occurredAt: `${inspectionDate}T00:00:00.000Z`,
                    auditor: null,
                  })
                  setInspectionOpen(false)
                  setInspectionDate('')
                  setInspectionGrade('')
                  setInspectionNotes('')
                  showToast('Inspection saved.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Inspection failed', 'error')
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={maintenanceOpen} title="Open Maintenance Ticket" onClose={() => setMaintenanceOpen(false)}>
        <div className="space-y-3">
          <FormField label="Title"><Input value={ticketTitle} onChange={(event) => setTicketTitle(event.target.value)} /></FormField>
          <FormField label="Expected Return"><Input type="date" value={ticketExpected} onChange={(event) => setTicketExpected(event.target.value)} /></FormField>
          <FormField label="Notes"><Textarea rows={3} value={ticketNotes} onChange={(event) => setTicketNotes(event.target.value)} /></FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setMaintenanceOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!asset || !ticketTitle.trim()) return
                try {
                  await createMaintenance.mutateAsync({
                    title: ticketTitle.trim(),
                    expectedReturnAt: ticketExpected ? `${ticketExpected}T00:00:00.000Z` : null,
                    notes: ticketNotes || null,
                  })
                  setMaintenanceOpen(false)
                  setTicketTitle('')
                  setTicketExpected('')
                  setTicketNotes('')
                  showToast('Ticket opened.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Open ticket failed', 'error')
                }
              }}
            >
              Open
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={maintenanceCompleteOpen}
        title="Complete Maintenance"
        onClose={() => {
          setMaintenanceCompleteOpen(false)
          setSelectedTicket(null)
        }}
      >
        <div className="space-y-3">
          <FormField label="Service Cost">
            <Input type="number" value={completeCost} onChange={(event) => setCompleteCost(event.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label="Downtime (hours)">
            <Input type="number" value={completeDowntimeHours} onChange={(event) => setCompleteDowntimeHours(event.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Condition After Service">
            <Select value={completeConditionGrade} onChange={(event) => setCompleteConditionGrade(event.target.value)}>
              <option value="">No update</option>
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
            </Select>
          </FormField>
          <FormField label="Service Report File Name (optional)">
            <Input value={completeReportFileName} onChange={(event) => setCompleteReportFileName(event.target.value)} placeholder="service-report.pdf" />
          </FormField>
          <FormField label="Completion Notes"><Textarea rows={3} value={completeNotes} onChange={(event) => setCompleteNotes(event.target.value)} /></FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setMaintenanceCompleteOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!selectedTicket) return
                try {
                  await completeMaintenance.mutateAsync({
                    ticketId: selectedTicket.id,
                    payload: {
                      cost: completeCost === '' ? null : Number(completeCost),
                      downtimeHours: completeDowntimeHours === '' ? null : Number(completeDowntimeHours),
                      conditionGrade: completeConditionGrade
                        ? (completeConditionGrade as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR')
                        : null,
                      notes: completeNotes.trim() || null,
                      reportFileName: completeReportFileName.trim() || null,
                    },
                  })
                  setMaintenanceCompleteOpen(false)
                  setSelectedTicket(null)
                  setCompleteNotes('')
                  setCompleteCost('')
                  setCompleteDowntimeHours('')
                  setCompleteConditionGrade('')
                  setCompleteReportFileName('')
                  showToast('Maintenance completed.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Complete ticket failed', 'error')
                }
              }}
            >
              Complete
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={disableOpen} title="Deactivate Asset" onClose={() => { setDisableOpen(false); setDisableReason('') }}>
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            This performs a soft deactivation and keeps full history. Active assignment and lifecycle actions will be blocked.
          </p>
          <FormField label="Reason / Note">
            <Textarea rows={3} value={disableReason} onChange={(event) => setDisableReason(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDisableOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!asset) return
                if (!disableReason.trim()) {
                  showToast('Disable reason is required.', 'error')
                  return
                }
                try {
                  await disableAsset.mutateAsync({ id: asset.id, reason: disableReason.trim() })
                  setDisableOpen(false)
                  setDisableReason('')
                  collapseSelection()
                  showToast('Asset disabled.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Disable failed', 'error')
                }
              }}
            >
              Confirm Deactivation
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
