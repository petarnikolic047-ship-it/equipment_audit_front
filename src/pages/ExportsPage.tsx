import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { SplitPane } from '../components/patterns/SplitPane'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Select } from '../components/primitives/Select'
import { Textarea } from '../components/primitives/Textarea'
import { Input } from '../components/primitives/Input'
import { useTableState } from '../utils/useTableState'
import { useCancelExportMutation, useCreateExportMutation, useExportJobQuery, useExportJobsQuery } from '../features/exports/hooks'
import type { ExportJob } from '../types/exports'
import { formatDateTime } from '../utils/format'
import { getDownloadLink } from '../api/services/filesService'
import { useToast } from '../components/patterns/useToast'
import { useMediaQuery } from '../utils/useMediaQuery'
import { Drawer } from '../components/primitives/Drawer'
import { Card } from '../components/primitives/Card'

export default function ExportsPage() {
  const navigate = useNavigate()
  const params = useParams<{ exportJobId: string }>()
  const selectedId = params.exportJobId ? Number(params.exportJobId) : undefined
  const table = useTableState()
  const [createOpen, setCreateOpen] = useState(false)
  const [type, setType] = useState('Inventory Register')
  const [format, setFormat] = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')
  const [filterJson, setFilterJson] = useState('{"status":"ALL"}')
  const [runningModalOpen, setRunningModalOpen] = useState(false)
  const [activeRunningJobId, setActiveRunningJobId] = useState<number | null>(null)
  const { showToast } = useToast()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const jobsQuery = useExportJobsQuery({ page: table.page, pageSize: table.pageSize, search: table.search || undefined })
  const selectedBase = jobsQuery.data?.items.find((item) => item.id === selectedId) ?? null
  const selectedQuery = useExportJobQuery(selectedId, Boolean(selectedId))
  const selected = selectedQuery.data ?? selectedBase
  const runningJob = useExportJobQuery(activeRunningJobId ?? undefined, Boolean(activeRunningJobId))
  const createMutation = useCreateExportMutation()
  const cancelMutation = useCancelExportMutation()

  useEffect(() => {
    if (!isDesktop || selectedId || jobsQuery.isLoading) return
    const first = jobsQuery.data?.items[0]
    if (first) {
      navigate(`/exports/${first.id}`, { replace: true })
    }
  }, [isDesktop, jobsQuery.data?.items, jobsQuery.isLoading, navigate, selectedId])

  const columns: DataTableColumn<ExportJob>[] = [
    { key: 'type', label: 'Type', render: (row) => row.type },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'format', label: 'Format', render: (row) => row.format },
    { key: 'createdAt', label: 'Created At', render: (row) => formatDateTime(row.createdAt) },
    { key: 'finishedAt', label: 'Finished At', render: (row) => formatDateTime(row.finishedAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => navigate(`/exports/${row.id}`)}>View</Button>
          <Button
            disabled={!row.outputFileId}
            onClick={async () => {
              if (!row.outputFileId) return
              const url = await getDownloadLink(row.outputFileId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
          >
            Download
          </Button>
        </div>
      ),
    },
  ]

  const detailContent = selected ? (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">{selected.type}</h2>
        <p className="text-sm text-slate-400">Export #{selected.id}</p>
      </div>
      <StatusBadge status={selected.status} />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-border py-2"><dt className="text-slate-400">Format</dt><dd>{selected.format}</dd></div>
        <div className="flex justify-between border-b border-border py-2"><dt className="text-slate-400">Created</dt><dd>{formatDateTime(selected.createdAt)}</dd></div>
        <div className="flex justify-between border-b border-border py-2"><dt className="text-slate-400">Finished</dt><dd>{formatDateTime(selected.finishedAt)}</dd></div>
      </dl>
      <Button
        disabled={!selected.outputFileId}
        onClick={async () => {
          if (!selected.outputFileId) return
          const url = await getDownloadLink(selected.outputFileId)
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
      >
        Download Artifact
      </Button>
    </div>
  ) : (
    <Card><p className="text-sm text-slate-400">Select an export job to inspect details.</p></Card>
  )

  return (
    <>
      <SplitPane
        list={
          <>
            <Card>
              <p className="text-sm text-slate-200">
                Reports is where you configure and run new exports. Exports is the async job history with status tracking and downloads.
              </p>
            </Card>
            <FilterBar
              searchValue={table.search}
              onSearchChange={table.setSearch}
              onReset={table.reset}
              actions={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  New Export
                </Button>
              }
            />
            <DataTable
              title="Exports"
              columns={columns}
              rows={jobsQuery.data?.items ?? []}
              loading={jobsQuery.isLoading}
              page={table.page}
              pageSize={table.pageSize}
              total={jobsQuery.data?.total ?? 0}
              onPageChange={table.setPage}
            />
          </>
        }
        detail={isDesktop ? detailContent : <p className="text-sm text-slate-400">Open an export to inspect details on mobile.</p>}
      />

      <Drawer open={!isDesktop && Boolean(selected)} title={`Export #${selected?.id ?? ''}`} onClose={() => navigate('/exports')}>
        {detailContent}
      </Drawer>

      <Dialog open={createOpen} title="Create Export Job" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <FormField label="Type">
            <Select value={type} onChange={(event) => setType(event.target.value)}>
              <option>Inventory Register</option>
              <option>Current Assignments</option>
              <option>Asset History</option>
              <option>Employee History</option>
              <option>Audit Log Export</option>
            </Select>
          </FormField>
          <FormField label="Format">
            <Select value={format} onChange={(event) => setFormat(event.target.value as 'XLSX' | 'CSV' | 'PDF')}>
              <option value="XLSX">XLSX</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
            </Select>
          </FormField>
          <FormField label="Filter JSON">
            <Textarea value={filterJson} onChange={(event) => setFilterJson(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const result = await createMutation.mutateAsync({ type, format, filterJson })
                  showToast(`Export job #${result.exportJobId} queued`, 'success')
                  setCreateOpen(false)
                  setActiveRunningJobId(result.exportJobId)
                  setRunningModalOpen(true)
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Failed to create export', 'error')
                }
              }}
            >
              Queue Export
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={runningModalOpen} title="Generating report..." onClose={() => undefined}>
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Please wait while the report is being generated. Download starts when ready.</p>
          <FormField label="Current Status">
            <Input value={runningJob.data?.status ?? 'RUNNING'} readOnly />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              variant="danger"
              onClick={async () => {
                if (!activeRunningJobId) return
                await cancelMutation.mutateAsync(activeRunningJobId)
                showToast('Export canceled', 'info')
                setRunningModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const finished = runningJob.data
                if (!finished || finished.status !== 'COMPLETED' || !finished.outputFileId) {
                  showToast('Export not completed yet', 'info')
                  return
                }
                const url = await getDownloadLink(finished.outputFileId)
                window.open(url, '_blank', 'noopener,noreferrer')
                setRunningModalOpen(false)
              }}
            >
              Download
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
