import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { Select } from '../components/primitives/Select'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Drawer } from '../components/primitives/Drawer'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Textarea } from '../components/primitives/Textarea'
import { Card } from '../components/primitives/Card'
import { ConfirmDialog } from '../components/patterns/ConfirmDialog'
import { useReferenceDataQuery } from '../features/reference/hooks'
import {
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useEmployeeDetailQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation,
} from '../features/employees/hooks'
import { useTableState } from '../utils/useTableState'
import { maskJmbg } from '../utils/format'
import { useMediaQuery } from '../utils/useMediaQuery'
import { useToast } from '../components/patterns/useToast'
import type { Employee } from '../types/employee'
import { useAssignmentsQuery, useReturnAssignmentMutation } from '../features/assignments/hooks'
import { getDownloadLink } from '../api/services/filesService'
import { Dialog } from '../components/primitives/Dialog'
import { EmployeeDetailWorkspace } from '../features/employees/components/EmployeeDetailWorkspace'
import type { InlineDetailTabItem } from '../components/primitives/InlineDetailTabs'
import { DESKTOP_MEDIA_QUERY } from '../constants/layout'

interface EmployeeForm {
  firstName: string
  lastName: string
  jmbg: string
  phone: string
  address: string | null
  positionId: number
}

const detailTabs: InlineDetailTabItem[] = [
  { id: 'details', label: 'Overview' },
  { id: 'assigned-assets', label: 'Assigned Assets' },
  { id: 'history', label: 'History' },
  { id: 'documents', label: 'Documents' },
]

const defaultTabId = 'details'
const validTabIds = new Set(detailTabs.map((item) => item.id))

function resolveTabId(tabId: string | null) {
  if (!tabId) return defaultTabId
  return validTabIds.has(tabId) ? tabId : defaultTabId
}

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isFullMode = Boolean(useMatch('/employees/:employeeId/full'))
  const params = useParams<{ employeeId: string }>()
  const selectedEmployeeId = params.employeeId ? Number(params.employeeId) : undefined
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<number[]>(() => (selectedEmployeeId ? [selectedEmployeeId] : []))
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const [positionFilter, setPositionFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [hasAssetsFilter, setHasAssetsFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [returnAssignmentId, setReturnAssignmentId] = useState<number | null>(null)
  const [returnReasonId, setReturnReasonId] = useState<number | null>(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const table = useTableState()
  const { showToast } = useToast()

  const rawTabId = searchParams.get('tab')
  const activeTab = resolveTabId(rawTabId)
  const searchString = searchParams.toString()

  const shouldFocusExpandedHeaderRef = useRef(false)
  const focusRowAfterCollapseRef = useRef<number | null>(null)
  const detailHeaderRef = useRef<HTMLDivElement | null>(null)
  const lastSelectedEmployeeIdRef = useRef<number | undefined>(selectedEmployeeId)

  const reference = useReferenceDataQuery()
  const employeesQuery = useEmployeesQuery({
    page: table.page,
    pageSize: table.pageSize,
    search: table.search || undefined,
    positionId: positionFilter ? Number(positionFilter) : undefined,
    active: activeFilter ? activeFilter === 'true' : undefined,
    hasAssets: hasAssetsFilter ? hasAssetsFilter === 'true' : undefined,
  })
  const availableEmployeeIds = useMemo(() => new Set((employeesQuery.data?.items ?? []).map((item) => item.id)), [employeesQuery.data?.items])
  const expandedVisibleEmployeeIds = useMemo(() => {
    const next = expandedEmployeeIds.filter((id) => availableEmployeeIds.has(id))
    if (selectedEmployeeId && availableEmployeeIds.has(selectedEmployeeId) && !next.includes(selectedEmployeeId)) {
      next.push(selectedEmployeeId)
    }
    return next
  }, [availableEmployeeIds, expandedEmployeeIds, selectedEmployeeId])
  const employeeDetail = useEmployeeDetailQuery(selectedEmployeeId)
  const selectedEmployee = employeeDetail.data ?? employeesQuery.data?.items.find((item) => item.id === selectedEmployeeId) ?? null
  const createMutation = useCreateEmployeeMutation()
  const updateMutation = useUpdateEmployeeMutation(editingEmployee?.id)
  const deactivateMutation = useDeactivateEmployeeMutation()
  const returnMutation = useReturnAssignmentMutation()
  const employeeAssignmentsQuery = useAssignmentsQuery(
    {
      page: 1,
      pageSize: 100,
      activeOnly: 'true',
      employeeId: selectedEmployee?.id,
    },
    Boolean(selectedEmployee?.id) && (activeTab === 'assigned-assets' || activeTab === 'details'),
  )
  const employeeHistoryQuery = useAssignmentsQuery(
    {
      page: 1,
      pageSize: 100,
      activeOnly: 'false',
      employeeId: selectedEmployee?.id,
    },
    Boolean(selectedEmployee?.id) && (activeTab === 'history' || activeTab === 'documents' || activeTab === 'details'),
  )
  const employeeOverdueAssignmentsQuery = useAssignmentsQuery(
    {
      page: 1,
      pageSize: 100,
      activeOnly: 'true',
      employeeId: selectedEmployee?.id,
      overdueReturn: true,
    },
    Boolean(selectedEmployee?.id) && activeTab === 'details',
  )
  const enabledReturnReasons = useMemo(
    () => (reference.returnReasons.data ?? []).filter((reason) => reason.enabled),
    [reference.returnReasons.data],
  )

  const defaults = useMemo<EmployeeForm>(
    () => ({
      firstName: editingEmployee?.firstName ?? '',
      lastName: editingEmployee?.lastName ?? '',
      jmbg: editingEmployee?.jmbg ?? '',
      phone: editingEmployee?.phone ?? '',
      address: editingEmployee?.address ?? null,
      positionId: editingEmployee?.positionId ?? reference.positions.data?.[0]?.id ?? 1,
    }),
    [editingEmployee, reference.positions.data],
  )
  const form = useForm<EmployeeForm>({ defaultValues: defaults })
  useEffect(() => {
    form.reset(defaults)
  }, [defaults, form])

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
    if (!isDesktop || isFullMode || !selectedEmployeeId) return
    if (employeesQuery.isLoading || employeesQuery.isFetching || !employeesQuery.data) return

    if (availableEmployeeIds.has(selectedEmployeeId)) return

    const fallbackId = expandedVisibleEmployeeIds[expandedVisibleEmployeeIds.length - 1]
    navigate(
      {
        pathname: fallbackId ? `/employees/${fallbackId}` : '/employees',
        search: searchString ? `?${searchString}` : '',
      },
      { replace: true },
    )
  }, [availableEmployeeIds, employeesQuery.data, employeesQuery.isFetching, employeesQuery.isLoading, expandedVisibleEmployeeIds, isDesktop, isFullMode, navigate, searchString, selectedEmployeeId])

  useEffect(() => {
    if (!isDesktop || isFullMode) {
      lastSelectedEmployeeIdRef.current = selectedEmployeeId
      return
    }

    const previousSelectedId = lastSelectedEmployeeIdRef.current
    const hasChanged = selectedEmployeeId !== previousSelectedId

    if (selectedEmployeeId && hasChanged) {
      const rowNode = document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${selectedEmployeeId}"]`)
      rowNode?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      if (shouldFocusExpandedHeaderRef.current) {
        requestAnimationFrame(() => detailHeaderRef.current?.focus())
        shouldFocusExpandedHeaderRef.current = false
      }
    }

    if (!selectedEmployeeId && focusRowAfterCollapseRef.current !== null) {
      const rowKey = focusRowAfterCollapseRef.current
      focusRowAfterCollapseRef.current = null
      requestAnimationFrame(() => {
        document.querySelector<HTMLTableRowElement>(`tr[data-row-key="${rowKey}"]`)?.focus()
      })
    }

    lastSelectedEmployeeIdRef.current = selectedEmployeeId
  }, [isDesktop, isFullMode, selectedEmployeeId])

  useEffect(() => {
    if (!isDesktop || isFullMode || !selectedEmployeeId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.closest('[role="dialog"]')) return

      focusRowAfterCollapseRef.current = selectedEmployeeId
      setExpandedEmployeeIds((current) => current.filter((id) => id !== selectedEmployeeId))
      navigate({ pathname: '/employees', search: searchString ? `?${searchString}` : '' })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDesktop, isFullMode, navigate, searchString, selectedEmployeeId])

  const watchedPositionId = useWatch({ control: form.control, name: 'positionId' })
  const assignedItems = useMemo(() => employeeAssignmentsQuery.data?.items ?? [], [employeeAssignmentsQuery.data?.items])
  const historyItems = useMemo(() => employeeHistoryQuery.data?.items ?? [], [employeeHistoryQuery.data?.items])
  const overdueAssetsCount = employeeOverdueAssignmentsQuery.data?.total ?? employeeOverdueAssignmentsQuery.data?.items.length ?? 0
  const employeeTabs = useMemo<InlineDetailTabItem[]>(
    () =>
      detailTabs.map((tab) => {
        if (tab.id === 'assigned-assets') return { ...tab, badgeCount: assignedItems.length }
        if (tab.id === 'history') return { ...tab, badgeCount: historyItems.length }
        if (tab.id === 'documents') return { ...tab, badgeCount: historyItems.filter((item) => item.reversFileId).length }
        return tab
      }),
    [assignedItems, historyItems],
  )

  const openCreate = () => {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  const resetEmployeeFilters = () => {
    table.reset()
    setPositionFilter('')
    setActiveFilter('')
    setHasAssetsFilter('')
  }

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const setActiveTab = (tabId: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (tabId === defaultTabId) next.delete('tab')
      else next.set('tab', tabId)
      return next
    }, { replace: true })
  }

  const navigateToEmployee = (employeeId: number, full = false) => {
    navigate({
      pathname: full ? `/employees/${employeeId}/full` : `/employees/${employeeId}`,
      search: searchString ? `?${searchString}` : '',
    })
  }

  const collapseEmployeeRow = (employeeId: number) => {
    setExpandedEmployeeIds((current) => current.filter((id) => id !== employeeId))
    if (selectedEmployeeId !== employeeId) return

    const remainingExpandedIds = expandedVisibleEmployeeIds.filter((id) => id !== employeeId)
    const fallbackId = remainingExpandedIds[remainingExpandedIds.length - 1]
    if (fallbackId) {
      navigateToEmployee(fallbackId, false)
      return
    }
    navigate({ pathname: '/employees', search: searchString ? `?${searchString}` : '' })
  }

  const collapseSelection = () => {
    if (selectedEmployeeId) setExpandedEmployeeIds((current) => current.filter((id) => id !== selectedEmployeeId))
    navigate({ pathname: '/employees', search: searchString ? `?${searchString}` : '' })
  }

  const handleRowToggle = (row: Employee, context?: { source: 'pointer' | 'keyboard'; rowKey: string }) => {
    const isExpanded = expandedVisibleEmployeeIds.includes(row.id)
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
      collapseEmployeeRow(row.id)
      return
    }

    setExpandedEmployeeIds((current) => (current.includes(row.id) ? current : [...current, row.id]))
    navigateToEmployee(row.id, false)
  }

  const submitQuickReturn = async () => {
    if (!returnAssignmentId || !returnReasonId || !returnNotes.trim()) {
      showToast('Return reason and notes are required.', 'error')
      return
    }
    try {
      await returnMutation.mutateAsync({
        id: returnAssignmentId,
        payload: {
          returnReasonId,
          notes: returnNotes.trim(),
        },
      })
      showToast('Assignment returned.', 'success')
      setReturnAssignmentId(null)
      setReturnReasonId(null)
      setReturnNotes('')
    } catch (error) {
      showToast((error as { message?: string }).message ?? 'Return failed', 'error')
    }
  }

  const submitEmployee = form.handleSubmit(async (values) => {
    try {
      if (editingEmployee) {
        await updateMutation.mutateAsync(values)
        showToast('Employee updated', 'success')
      } else {
        await createMutation.mutateAsync(values)
        showToast('Employee created', 'success')
      }
      setFormOpen(false)
    } catch (error) {
      showToast((error as { message?: string }).message ?? 'Failed to save employee', 'error')
    }
  })

  const columns: DataTableColumn<Employee>[] = [
    { key: 'name', label: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'jmbg', label: 'JMBG', render: (row) => maskJmbg(row.jmbg) },
    { key: 'phone', label: 'Phone', render: (row) => row.phone },
    { key: 'position', label: 'Position', render: (row) => row.positionName },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'DISABLED'} /> },
    {
      key: 'assetsWarning',
      label: 'Assets Warning',
      render: (row) =>
        row.hasActiveAssignments ? <span className="text-xs font-semibold text-amber-300">Has active assets</span> : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation()
              navigateToEmployee(row.id)
              openEdit(row)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {isFullMode ? (
        selectedEmployee ? (
          <EmployeeDetailWorkspace
            employee={selectedEmployee}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabIdBase={`employee-${selectedEmployee.id}`}
            tabs={employeeTabs}
            isDesktop={isDesktop}
            isFullMode
            isOpen
            headerFocusRef={detailHeaderRef}
            onBackToList={() => navigateToEmployee(selectedEmployee.id, false)}
            onEdit={() => openEdit(selectedEmployee)}
            onDeactivate={() => setDeactivateOpen(true)}
            onOpenAssignment={(assignmentId) => navigate(`/assignments/${assignmentId}`)}
            onOpenAsset={(assetId) => navigate(`/assets/${assetId}`)}
            onDownloadRevers={async (fileId) => {
              const url = await getDownloadLink(fileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
            overdueAssetsCount={overdueAssetsCount}
            assignedItems={assignedItems}
            historyItems={historyItems}
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-400">Employee not found.</p>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          <FilterBar
            searchValue={table.search}
            onSearchChange={table.setSearch}
            onReset={resetEmployeeFilters}
            showResetButton={false}
          >
            <FormField label="Position">
              <Select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                <option value="">All positions</option>
                {reference.positions.data?.map((position) => (
                  <option key={position.id} value={position.id}>{position.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
                <option value="">Any status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormField>
            <FormField label="Assignments">
              <Select value={hasAssetsFilter} onChange={(event) => setHasAssetsFilter(event.target.value)}>
                <option value="">Any</option>
                <option value="true">Has active assets</option>
                <option value="false">No active assets</option>
              </Select>
            </FormField>
          </FilterBar>

          <DataTable
            title="Employees"
            actions={
              <>
                <Button variant="primary" onClick={openCreate}>
                  Create Employee
                </Button>
                <Button onClick={resetEmployeeFilters}>Reset</Button>
              </>
            }
            columns={columns}
            rows={employeesQuery.data?.items ?? []}
            loading={employeesQuery.isLoading}
            page={table.page}
            pageSize={table.pageSize}
            total={employeesQuery.data?.total ?? 0}
            onPageChange={table.setPage}
            rowKey={(row) => row.id}
            onRowClick={handleRowToggle}
            isRowActive={(row) => row.id === selectedEmployeeId}
            isRowExpanded={(row) => Boolean(isDesktop && expandedVisibleEmployeeIds.includes(row.id))}
            renderExpandedContent={(row) => {
              const workspaceEmployee = selectedEmployee?.id === row.id ? selectedEmployee : row
              const workspaceAssignedItems = selectedEmployee?.id === row.id ? assignedItems : []
              const workspaceHistoryItems = selectedEmployee?.id === row.id ? historyItems : []

              return (
                <div className="py-2">
                  <EmployeeDetailWorkspace
                    employee={workspaceEmployee}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabIdBase={`employee-${workspaceEmployee.id}`}
                    tabs={employeeTabs}
                    isDesktop={isDesktop}
                    isFullMode={false}
                    isOpen={expandedVisibleEmployeeIds.includes(row.id)}
                    headerFocusRef={detailHeaderRef}
                    onClose={() => collapseEmployeeRow(row.id)}
                    onEdit={() => openEdit(workspaceEmployee)}
                    onDeactivate={() => {
                      if (selectedEmployee?.id === workspaceEmployee.id) setDeactivateOpen(true)
                    }}
                    onOpenAssignment={(assignmentId) => navigate(`/assignments/${assignmentId}`)}
                    onOpenAsset={(assetId) => navigate(`/assets/${assetId}`)}
                    onDownloadRevers={async (fileId) => {
                      const url = await getDownloadLink(fileId)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
                    overdueAssetsCount={workspaceEmployee.id === selectedEmployee?.id ? overdueAssetsCount : 0}
                    assignedItems={workspaceAssignedItems}
                    historyItems={workspaceHistoryItems}
                  />
                </div>
              )
            }}
            expandedRowClassName="bg-transparent"
            tableBodyClassName={isDesktop ? 'max-h-none overflow-visible' : undefined}
            emptyMessage="No employees found. Create an employee before assigning equipment."
          />
        </div>
      )}

      <Drawer
        open={!isDesktop && !isFullMode && Boolean(selectedEmployee)}
        title="Employee Details"
        onClose={collapseSelection}
      >
        {selectedEmployee ? (
          <EmployeeDetailWorkspace
            employee={selectedEmployee}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabIdBase={`employee-${selectedEmployee.id}`}
            tabs={employeeTabs}
            isDesktop={false}
            isFullMode={false}
            isOpen
            onClose={collapseSelection}
            onEdit={() => openEdit(selectedEmployee)}
            onDeactivate={() => setDeactivateOpen(true)}
            onOpenAssignment={(assignmentId) => navigate(`/assignments/${assignmentId}`)}
            onOpenAsset={(assetId) => navigate(`/assets/${assetId}`)}
            onDownloadRevers={async (fileId) => {
              const url = await getDownloadLink(fileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            onReturn={(assignmentId) => setReturnAssignmentId(assignmentId)}
            overdueAssetsCount={overdueAssetsCount}
            assignedItems={assignedItems}
            historyItems={historyItems}
          />
        ) : null}
      </Drawer>

      <Drawer open={formOpen} title={editingEmployee ? 'Edit Employee' : 'Create Employee'} onClose={() => setFormOpen(false)}>
        <form className="space-y-3" onSubmit={submitEmployee}>
          <FormField label="First Name">
            <Input {...form.register('firstName', { required: true })} />
          </FormField>
          <FormField label="Last Name">
            <Input {...form.register('lastName', { required: true })} />
          </FormField>
          <FormField label="JMBG">
            <Input {...form.register('jmbg', { required: true })} />
          </FormField>
          <FormField label="Phone">
            <Input {...form.register('phone', { required: true })} />
          </FormField>
          <FormField label="Address">
            <Textarea rows={2} {...form.register('address')} />
          </FormField>
          <FormField label="Position">
            <Select value={watchedPositionId ?? ''} onChange={(event) => form.setValue('positionId', Number(event.target.value))}>
              {reference.positions.data?.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Employee</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={async () => {
          if (!selectedEmployee) return
          try {
            await deactivateMutation.mutateAsync(selectedEmployee.id)
            showToast('Employee deactivated', 'success')
            setDeactivateOpen(false)
          } catch (error) {
            showToast((error as { message?: string }).message ?? 'Failed to deactivate employee', 'error')
          }
        }}
        title="Deactivate Employee"
        description="This employee will be marked inactive."
        confirmText="Deactivate"
        intent="danger"
      />

      <Dialog open={Boolean(returnAssignmentId)} title="Return Asset" onClose={() => setReturnAssignmentId(null)}>
        <div className="space-y-3">
          <FormField label="Return Reason">
            <Select value={returnReasonId ?? ''} onChange={(event) => setReturnReasonId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Select reason</option>
              {enabledReturnReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.reasonText}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea rows={3} value={returnNotes} onChange={(event) => setReturnNotes(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setReturnAssignmentId(null)}>Cancel</Button>
            <Button variant="primary" onClick={submitQuickReturn}>
              Confirm Return
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
