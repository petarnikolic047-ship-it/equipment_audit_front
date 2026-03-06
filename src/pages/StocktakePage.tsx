import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { SplitPane } from '../components/patterns/SplitPane'
import { Button } from '../components/primitives/Button'
import { Card } from '../components/primitives/Card'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Select } from '../components/primitives/Select'
import { Textarea } from '../components/primitives/Textarea'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { useToast } from '../components/patterns/useToast'
import { useReferenceDataQuery } from '../features/reference/hooks'
import {
  useCreateStocktakeMutation,
  useFinalizeStocktakeMutation,
  useReconcileStocktakeMutation,
  useStartStocktakeMutation,
  useStocktakeAuditsQuery,
  useStocktakeDetailQuery,
  useUpsertStocktakeEntryMutation,
} from '../features/stocktake/hooks'
import type { StocktakeAudit, StocktakeEntry } from '../types/assetOps'
import { useTableState } from '../utils/useTableState'
import { formatDateTime } from '../utils/format'
import { getDownloadLink } from '../api/services/filesService'

export default function StocktakePage() {
  const table = useTableState()
  const { showToast } = useToast()
  const reference = useReferenceDataQuery()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryAuditId, setEntryAuditId] = useState<number | null>(null)
  const [entryAssetId, setEntryAssetId] = useState<number | null>(null)
  const [entryFound, setEntryFound] = useState('true')
  const [entryCondition, setEntryCondition] = useState('')
  const [entryLocationId, setEntryLocationId] = useState<number | null>(null)
  const [entryNotes, setEntryNotes] = useState('')
  const [createName, setCreateName] = useState('')
  const [createLocationId, setCreateLocationId] = useState<number | null>(null)
  const [createCategoryId, setCreateCategoryId] = useState<number | null>(null)
  const [createNotes, setCreateNotes] = useState('')

  const auditsQuery = useStocktakeAuditsQuery({
    page: table.page,
    pageSize: table.pageSize,
    search: table.search || undefined,
    status: statusFilter || undefined,
  })
  const effectiveSelectedId = selectedAuditId ?? auditsQuery.data?.items[0]?.id ?? undefined
  const detailQuery = useStocktakeDetailQuery(effectiveSelectedId)
  const createMutation = useCreateStocktakeMutation()
  const startMutation = useStartStocktakeMutation(effectiveSelectedId)
  const reconcileMutation = useReconcileStocktakeMutation(effectiveSelectedId)
  const finalizeMutation = useFinalizeStocktakeMutation(effectiveSelectedId)
  const upsertEntryMutation = useUpsertStocktakeEntryMutation(entryAuditId ?? effectiveSelectedId)

  const selectedAudit = detailQuery.data?.audit ?? null
  const entries = detailQuery.data?.entries ?? []
  const reconcileResult = reconcileMutation.data ?? null

  const auditsColumns: DataTableColumn<StocktakeAudit>[] = [
    { key: 'name', label: 'Audit', render: (row) => row.name },
    { key: 'scope', label: 'Scope', render: (row) => `${row.scopeLocationName ?? 'All locations'} / ${row.scopeCategoryName ?? 'All categories'}` },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', label: 'Created', render: (row) => formatDateTime(row.createdAt) },
    { key: 'discrepancyCount', label: 'Discrepancies', render: (row) => row.discrepancyCount },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSelectedAuditId(row.id)}>
            View
          </Button>
          {row.reportFileId ? (
            <Button
              variant="secondary"
              onClick={async () => {
                const url = await getDownloadLink(row.reportFileId as number)
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
            >
              Report
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  const entriesColumns: DataTableColumn<StocktakeEntry>[] = [
    { key: 'inventoryNumber', label: 'Inventory', render: (row) => row.inventoryNumber },
    { key: 'assetName', label: 'Asset', render: (row) => row.assetName },
    { key: 'found', label: 'Found', render: (row) => <StatusBadge status={row.found ? 'COMPLETED' : 'FAILED'} /> },
    { key: 'discrepancyType', label: 'Discrepancy', render: (row) => row.discrepancyType },
    { key: 'conditionGrade', label: 'Condition', render: (row) => row.conditionGrade ?? '-' },
    { key: 'actualLocationName', label: 'Actual Location', render: (row) => row.actualLocationName ?? '-' },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={selectedAudit?.status === 'FINALIZED'}
            onClick={() => {
              setEntryOpen(true)
              setEntryAuditId(selectedAudit?.id ?? null)
              setEntryAssetId(row.assetId)
              setEntryFound(row.found ? 'true' : 'false')
              setEntryCondition(row.conditionGrade ?? '')
              setEntryLocationId(
                reference.locations.data?.find((location) => location.name === row.actualLocationName)?.id ?? null,
              )
              setEntryNotes(row.notes ?? '')
            }}
          >
            Record
          </Button>
        </div>
      ),
    },
  ]

  const discrepancyRows = useMemo(() => {
    if (!reconcileResult) return []
    return reconcileResult.proposedUpdates
  }, [reconcileResult])

  return (
    <>
      <SplitPane
        list={
          <>
            <FilterBar
              searchValue={table.search}
              onSearchChange={table.setSearch}
              onReset={() => {
                table.reset()
                setStatusFilter('')
                setSelectedAuditId(null)
              }}
              actions={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Create Audit
                </Button>
              }
            >
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RECONCILING">RECONCILING</option>
                <option value="FINALIZED">FINALIZED</option>
              </Select>
            </FilterBar>
            <DataTable
              title="Stocktake Audits"
              columns={auditsColumns}
              rows={auditsQuery.data?.items ?? []}
              loading={auditsQuery.isLoading}
              page={table.page}
              pageSize={table.pageSize}
              total={auditsQuery.data?.total ?? 0}
              onPageChange={table.setPage}
            />
          </>
        }
        detail={
          selectedAudit ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100">{selectedAudit.name}</h2>
                <p className="text-sm text-slate-400">
                  Scope: {selectedAudit.scopeLocationName ?? 'All locations'} / {selectedAudit.scopeCategoryName ?? 'All categories'}
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedAudit.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  disabled={selectedAudit.status !== 'DRAFT' && selectedAudit.status !== 'IN_PROGRESS'}
                  onClick={async () => {
                    try {
                      await startMutation.mutateAsync()
                      showToast('Audit moved to execution.', 'success')
                    } catch (error) {
                      showToast((error as { message?: string }).message ?? 'Start failed', 'error')
                    }
                  }}
                >
                  Execute
                </Button>
                <Button
                  variant="secondary"
                  disabled={selectedAudit.status === 'FINALIZED'}
                  onClick={async () => {
                    try {
                      await reconcileMutation.mutateAsync()
                      showToast('Reconciliation prepared.', 'success')
                    } catch (error) {
                      showToast((error as { message?: string }).message ?? 'Reconcile failed', 'error')
                    }
                  }}
                >
                  Reconcile
                </Button>
                <Button
                  variant="secondary"
                  disabled={selectedAudit.status === 'FINALIZED'}
                  onClick={async () => {
                    try {
                      const result = await finalizeMutation.mutateAsync()
                      showToast(`Audit finalized with ${result.discrepancyCount} discrepancies.`, 'success')
                    } catch (error) {
                      showToast((error as { message?: string }).message ?? 'Finalize failed', 'error')
                    }
                  }}
                >
                  Finalize
                </Button>
                {selectedAudit.reportFileId ? (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const url = await getDownloadLink(selectedAudit.reportFileId as number)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    Download Report
                  </Button>
                ) : null}
              </div>
              <DataTable
                title="Execution Entries"
                columns={entriesColumns}
                rows={entries}
                loading={detailQuery.isLoading}
                page={1}
                pageSize={Math.max(1, entries.length || 1)}
                total={entries.length}
                onPageChange={() => undefined}
              />
              {discrepancyRows.length ? (
                <Card title="Reconciliation Proposals">
                  <ul className="space-y-2 text-sm">
                    {discrepancyRows.map((row) => (
                      <li key={`${row.assetId}-${row.action}`} className="rounded-xl border border-border bg-slate-900/50 px-3 py-2">
                        <p className="font-medium text-slate-100">
                          {row.inventoryNumber}: {row.action}
                        </p>
                        <p className="text-slate-300">
                          {row.fromValue ?? '-'} {'->'} {row.toValue ?? '-'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select a stocktake audit to execute and reconcile discrepancies.</p>
          )
        }
      />

      <Dialog open={createOpen} title="Create Stocktake Audit" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <FormField label="Name">
            <Input value={createName} onChange={(event) => setCreateName(event.target.value)} />
          </FormField>
          <FormField label="Location Scope">
            <Select
              value={createLocationId ?? ''}
              onChange={(event) => setCreateLocationId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">All locations</option>
              {reference.locations.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Category Scope">
            <Select
              value={createCategoryId ?? ''}
              onChange={(event) => setCreateCategoryId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">All categories</option>
              {reference.categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea rows={3} value={createNotes} onChange={(event) => setCreateNotes(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const audit = await createMutation.mutateAsync({
                    name: createName.trim(),
                    scopeLocationId: createLocationId,
                    scopeCategoryId: createCategoryId,
                    notes: createNotes.trim() || null,
                  })
                  setSelectedAuditId(audit.id)
                  setCreateOpen(false)
                  setCreateName('')
                  setCreateLocationId(null)
                  setCreateCategoryId(null)
                  setCreateNotes('')
                  showToast('Stocktake audit created.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Create failed', 'error')
                }
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={entryOpen} title="Record Stocktake Entry" onClose={() => setEntryOpen(false)}>
        <div className="space-y-3">
          <FormField label="Found">
            <Select value={entryFound} onChange={(event) => setEntryFound(event.target.value)}>
              <option value="true">Found</option>
              <option value="false">Missing</option>
            </Select>
          </FormField>
          <FormField label="Condition">
            <Select value={entryCondition} onChange={(event) => setEntryCondition(event.target.value)}>
              <option value="">No grade</option>
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
            </Select>
          </FormField>
          <FormField label="Actual Location">
            <Select
              value={entryLocationId ?? ''}
              onChange={(event) => setEntryLocationId(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Same as expected</option>
              {reference.locations.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea rows={3} value={entryNotes} onChange={(event) => setEntryNotes(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!entryAuditId || !entryAssetId) {
                  showToast('Audit and asset are required.', 'error')
                  return
                }
                try {
                  await upsertEntryMutation.mutateAsync({
                    assetId: entryAssetId,
                    found: entryFound === 'true',
                    conditionGrade: entryCondition ? (entryCondition as StocktakeEntry['conditionGrade']) : null,
                    actualLocationId: entryLocationId,
                    notes: entryNotes.trim() || null,
                  })
                  setEntryOpen(false)
                  showToast('Stocktake entry recorded.', 'success')
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Entry update failed', 'error')
                }
              }}
            >
              Save Entry
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
