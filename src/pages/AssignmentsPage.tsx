import { useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Select } from '../components/primitives/Select'
import { useTableState } from '../utils/useTableState'
import {
  useAssignmentDetailQuery,
  useAssignmentsQuery,
} from '../features/assignments/hooks'
import { useReferenceDataQuery } from '../features/reference/hooks'
import { formatDateTime } from '../utils/format'
import type { Assignment } from '../types/assignment'
import { useToast } from '../components/patterns/useToast'
import { getDownloadLink } from '../api/services/filesService'
import { useAssetsQuery } from '../features/assets/hooks'
import { useEmployeesQuery } from '../features/employees/hooks'
import { Card } from '../components/primitives/Card'
import { Drawer } from '../components/primitives/Drawer'
import { useMediaQuery } from '../utils/useMediaQuery'
import { Input } from '../components/primitives/Input'
import { AssignModal } from '../features/assignments/components/AssignModal'
import { ReturnModal } from '../features/assignments/components/ReturnModal'
import { useAuthStore } from '../features/auth/authStore'
import { FormField } from '../components/patterns/FormField'
import { AssignmentDetailWorkspace } from '../features/assignments/components/AssignmentDetailWorkspace'
import type { InlineDetailTabItem } from '../components/primitives/InlineDetailTabs'
import { DESKTOP_MEDIA_QUERY } from '../constants/layout'

const detailTabs: InlineDetailTabItem[] = [{ id: 'overview', label: 'Overview' }]
const defaultTabId = 'overview'

function resolveTab(tabId: string | null) {
  if (!tabId) return defaultTabId
  return tabId === defaultTabId ? defaultTabId : defaultTabId
}

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isFullMode = Boolean(useMatch('/assignments/:assignmentId/full'))
  const params = useParams<{ assignmentId: string }>()
  const selectedAssignmentId = params.assignmentId ? Number(params.assignmentId) : undefined
  const [activeOnly, setActiveOnly] = useState('true')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [assetFilter, setAssetFilter] = useState('')
  const [takenFrom, setTakenFrom] = useState('')
  const [takenTo, setTakenTo] = useState('')
  const [overdueFilter, setOverdueFilter] = useState('')
  const [deactivatedEmployeeFilter, setDeactivatedEmployeeFilter] = useState('')
  const [returnAssignmentId, setReturnAssignmentId] = useState<number | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [lastReversFileId, setLastReversFileId] = useState<number | null>(null)
  const table = useTableState()
  const { showToast } = useToast()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const role = useAuthStore((state) => state.role)
  const canRunLifecycle = role ? ['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(role) : false

  const rawTabId = searchParams.get('tab')
  const activeTab = resolveTab(rawTabId)
  const searchString = searchParams.toString()

  const shouldFocusExpandedHeaderRef = useRef(false)
  const focusRowAfterCollapseRef = useRef<number | null>(null)
  const detailHeaderRef = useRef<HTMLDivElement | null>(null)
  const lastSelectedAssignmentIdRef = useRef<number | undefined>(selectedAssignmentId)

  useReferenceDataQuery()
  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 500, active: true })
  const assetsQuery = useAssetsQuery({ page: 1, pageSize: 500, active: true })
  const assignmentsQuery = useAssignmentsQuery({
    page: table.page,
    pageSize: table.pageSize,
    search: table.search || undefined,
    activeOnly,
    employeeId: employeeFilter ? Number(employeeFilter) : undefined,
    assetId: assetFilter ? Number(assetFilter) : undefined,
    takenFrom: takenFrom ? `${takenFrom}T00:00:00.000Z` : undefined,
    takenTo: takenTo ? `${takenTo}T23:59:59.999Z` : undefined,
    overdueReturn: overdueFilter ? overdueFilter === 'true' : undefined,
    employeeDeactivatedWithActive: deactivatedEmployeeFilter ? deactivatedEmployeeFilter === 'true' : undefined,
  })
  const selectedFromList = assignmentsQuery.data?.items.find((item) => item.id === selectedAssignmentId) ?? null
  const selectedDetailQuery = useAssignmentDetailQuery(selectedAssignmentId)
  const selectedAssignment = selectedDetailQuery.data ?? selectedFromList ?? null

  useEffect(() => {
    if (!rawTabId) return
    if (rawTabId === defaultTabId) return
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.delete('tab')
      return next
    }, { replace: true })
  }, [rawTabId, setSearchParams])

  useEffect(() => {
    if (!isDesktop || isFullMode || !selectedAssignmentId) return
    if (assignmentsQuery.isLoading || assignmentsQuery.isFetching || !assignmentsQuery.data) return

    const selectedExists = assignmentsQuery.data.items.some((item) => item.id === selectedAssignmentId)
    if (!selectedExists) {
      navigate({ pathname: '/assignments', search: searchString ? `?${searchString}` : '' }, { replace: true })
    }
  }, [assignmentsQuery.data, assignmentsQuery.isFetching, assignmentsQuery.isLoading, isDesktop, isFullMode, navigate, searchString, selectedAssignmentId])

  useEffect(() => {
    if (!isDesktop || isFullMode) {
      lastSelectedAssignmentIdRef.current = selectedAssignmentId
      return
    }

    const previousSelectedId = lastSelectedAssignmentIdRef.current
    const hasChanged = selectedAssignmentId !== previousSelectedId

    if (selectedAssignmentId && hasChanged) {
      const rowNode = document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${selectedAssignmentId}"]`)
      rowNode?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      if (shouldFocusExpandedHeaderRef.current) {
        requestAnimationFrame(() => detailHeaderRef.current?.focus())
        shouldFocusExpandedHeaderRef.current = false
      }
    }

    if (!selectedAssignmentId && focusRowAfterCollapseRef.current !== null) {
      const rowKey = focusRowAfterCollapseRef.current
      focusRowAfterCollapseRef.current = null
      requestAnimationFrame(() => {
        document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${rowKey}"]`)?.focus()
      })
    }

    lastSelectedAssignmentIdRef.current = selectedAssignmentId
  }, [isDesktop, isFullMode, selectedAssignmentId])

  useEffect(() => {
    if (!isDesktop || isFullMode || !selectedAssignmentId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.closest('[role="dialog"]')) return

      focusRowAfterCollapseRef.current = selectedAssignmentId
      navigate({ pathname: '/assignments', search: searchString ? `?${searchString}` : '' })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDesktop, isFullMode, navigate, searchString, selectedAssignmentId])

  const statusByAssetId = useMemo(() => {
    const map = new Map<number, string>()
    ;(assetsQuery.data?.items ?? []).forEach((asset) => {
      map.set(asset.id, asset.status)
    })
    return map
  }, [assetsQuery.data?.items])

  const setActiveTab = (tabId: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (tabId === defaultTabId) next.delete('tab')
      else next.set('tab', tabId)
      return next
    }, { replace: true })
  }

  const navigateToAssignment = (assignmentId: number, full = false) => {
    navigate({
      pathname: full ? `/assignments/${assignmentId}/full` : `/assignments/${assignmentId}`,
      search: searchString ? `?${searchString}` : '',
    })
  }

  const openAssetFromAssignment = (assetId: number) => {
    navigate(`/assets/${assetId}`, { state: { focusRowId: assetId, centerRow: true } })
  }

  const collapseSelection = () => {
    navigate({ pathname: '/assignments', search: searchString ? `?${searchString}` : '' })
  }

  const resetAssignmentFilters = () => {
    table.reset()
    setActiveOnly('true')
    setEmployeeFilter('')
    setAssetFilter('')
    setTakenFrom('')
    setTakenTo('')
    setOverdueFilter('')
    setDeactivatedEmployeeFilter('')
  }

  const handleRowToggle = (row: Assignment, context?: { source: 'pointer' | 'keyboard'; rowKey: string }) => {
    const isSameRow = row.id === selectedAssignmentId
    if (context?.source === 'keyboard') {
      if (isSameRow) {
        focusRowAfterCollapseRef.current = row.id
      } else {
        shouldFocusExpandedHeaderRef.current = true
      }
    } else {
      shouldFocusExpandedHeaderRef.current = false
    }

    if (isSameRow) {
      collapseSelection()
      return
    }

    navigateToAssignment(row.id, false)
  }

  const columns: DataTableColumn<Assignment>[] = [
    { key: 'asset', label: 'Asset', render: (row) => `${row.assetInventoryNumber} - ${row.assetName}` },
    { key: 'employee', label: 'Employee', render: (row) => row.employeeFullName },
    { key: 'takenAt', label: 'Taken At', render: (row) => formatDateTime(row.takenAt) },
    { key: 'dueAt', label: 'Due At', render: (row) => formatDateTime(row.dueAt) },
    { key: 'returnedAt', label: 'Returned At', render: (row) => formatDateTime(row.returnedAt) },
    {
      key: 'assetStatus',
      label: 'Asset Status',
      render: (row) => <StatusBadge status={statusByAssetId.get(row.assetId) ?? (row.returnedAt ? 'IN_STOCK' : 'ASSIGNED')} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            disabled={Boolean(row.returnedAt) || !canRunLifecycle}
            onClick={(event) => {
              event.stopPropagation()
              setReturnAssignmentId(row.id)
            }}
          >
            Return
          </Button>
          <Button
            disabled={!row.reversFileId}
            onClick={async (event) => {
              event.stopPropagation()
              if (!row.reversFileId) {
                showToast('No revers attached', 'error')
                return
              }
              const url = await getDownloadLink(row.reversFileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
          >
            Download Revers
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {isFullMode ? (
        selectedAssignment ? (
          <AssignmentDetailWorkspace
            assignment={selectedAssignment}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabIdBase={`assignment-${selectedAssignment.id}`}
            tabs={detailTabs}
            isDesktop={isDesktop}
            isFullMode
            isOpen
            assetStatus={statusByAssetId.get(selectedAssignment.assetId) ?? 'IN_STOCK'}
            canRunLifecycle={canRunLifecycle}
            lastReversFileId={lastReversFileId}
            headerFocusRef={detailHeaderRef}
            onBackToList={() => navigateToAssignment(selectedAssignment.id)}
            onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
            onDownloadRevers={async (fileId) => {
              const url = await getDownloadLink(fileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            onOpenAsset={openAssetFromAssignment}
            onOpenEmployee={(employeeId) => navigate(`/employees/${employeeId}`)}
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-400">Assignment not found.</p>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <FilterBar
            searchValue={table.search}
            onSearchChange={table.setSearch}
            onReset={resetAssignmentFilters}
            showResetButton={false}
          >
            <FormField label="Scope">
              <Select value={activeOnly} onChange={(event) => setActiveOnly(event.target.value)}>
                <option value="true">Active only</option>
                <option value="false">All assignments</option>
              </Select>
            </FormField>
            <FormField label="Employee">
              <Select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                <option value="">All employees</option>
                {(employeesQuery.data?.items ?? []).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Asset">
              <Select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)}>
                <option value="">All assets</option>
                {(assetsQuery.data?.items ?? []).map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.inventoryNumber} - {asset.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Taken From">
              <Input type="date" value={takenFrom} onChange={(event) => setTakenFrom(event.target.value)} />
            </FormField>
            <FormField label="Taken To">
              <Input type="date" value={takenTo} onChange={(event) => setTakenTo(event.target.value)} />
            </FormField>
            <FormField label="Overdue">
              <Select value={overdueFilter} onChange={(event) => setOverdueFilter(event.target.value)}>
                <option value="">Any</option>
                <option value="true">Overdue only</option>
                <option value="false">Not overdue</option>
              </Select>
            </FormField>
            <FormField label="Employee State">
              <Select value={deactivatedEmployeeFilter} onChange={(event) => setDeactivatedEmployeeFilter(event.target.value)}>
                <option value="">Any</option>
                <option value="true">Deactivated with active assets</option>
                <option value="false">Active employees</option>
              </Select>
            </FormField>
          </FilterBar>

          <DataTable
            title="Current Assignments"
            actions={
              <>
                <Button variant="primary" disabled={!canRunLifecycle} onClick={() => setAssignOpen(true)}>
                  Assign Equipment
                </Button>
                <Button onClick={resetAssignmentFilters}>Reset</Button>
              </>
            }
            columns={columns}
            rows={assignmentsQuery.data?.items ?? []}
            loading={assignmentsQuery.isLoading}
            page={table.page}
            pageSize={table.pageSize}
            total={assignmentsQuery.data?.total ?? 0}
            onPageChange={table.setPage}
            rowKey={(row) => row.id}
            onRowClick={handleRowToggle}
            isRowActive={(row) => row.id === selectedAssignmentId}
            isRowExpanded={(row) => Boolean(isDesktop && row.id === selectedAssignmentId && selectedAssignment)}
            renderExpandedContent={(row) => {
              const workspaceAssignment = selectedAssignment?.id === row.id ? selectedAssignment : row

              return (
                <div className="px-4 py-3">
                  <AssignmentDetailWorkspace
                    assignment={workspaceAssignment}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabIdBase={`assignment-${workspaceAssignment.id}`}
                    tabs={detailTabs}
                    isDesktop={isDesktop}
                    isFullMode={false}
                    isOpen={row.id === selectedAssignmentId}
                    assetStatus={statusByAssetId.get(workspaceAssignment.assetId) ?? 'IN_STOCK'}
                    canRunLifecycle={canRunLifecycle}
                    lastReversFileId={lastReversFileId}
                    headerFocusRef={detailHeaderRef}
                    onClose={collapseSelection}
                    onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
                    onDownloadRevers={async (fileId) => {
                      const url = await getDownloadLink(fileId)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    onOpenAsset={openAssetFromAssignment}
                    onOpenEmployee={(employeeId) => navigate(`/employees/${employeeId}`)}
                  />
                </div>
              )
            }}
            expandedRowClassName="bg-transparent"
            tableBodyClassName={isDesktop ? 'max-h-none overflow-visible' : undefined}
            emptyMessage="No assignments match this filter set. Start a new assignment to generate a revers."
          />
        </div>
      )}

      <Drawer
        open={!isDesktop && !isFullMode && Boolean(selectedAssignment)}
        title={`Assignment #${selectedAssignment?.id ?? ''}`}
        onClose={collapseSelection}
      >
        {selectedAssignment ? (
          <AssignmentDetailWorkspace
            assignment={selectedAssignment}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabIdBase={`assignment-${selectedAssignment.id}`}
            tabs={detailTabs}
            isDesktop={false}
            isFullMode={false}
            isOpen
            assetStatus={statusByAssetId.get(selectedAssignment.assetId) ?? 'IN_STOCK'}
            canRunLifecycle={canRunLifecycle}
            lastReversFileId={lastReversFileId}
            onClose={collapseSelection}
            onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
            onDownloadRevers={async (fileId) => {
              const url = await getDownloadLink(fileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            onOpenAsset={openAssetFromAssignment}
            onOpenEmployee={(employeeId) => navigate(`/employees/${employeeId}`)}
          />
        ) : null}
      </Drawer>

      <AssignModal
        key={`assign-${assignOpen ? 'open' : 'closed'}`}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={(payload) => {
          setLastReversFileId(payload.fileId)
          showToast('Assignment created successfully.', 'success')
          navigateToAssignment(payload.assignmentId)
          setAssignOpen(false)
        }}
      />

      <ReturnModal
        open={Boolean(returnAssignmentId)}
        assignmentId={returnAssignmentId}
        onClose={() => setReturnAssignmentId(null)}
        onReturned={(payload) => {
          showToast('Assignment returned successfully.', 'success')
          if (payload.assignmentId) {
            navigateToAssignment(payload.assignmentId)
          }
          setReturnAssignmentId(null)
        }}
      />
    </>
  )
}
