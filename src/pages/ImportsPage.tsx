import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { SplitPane } from '../components/patterns/SplitPane'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Drawer } from '../components/primitives/Drawer'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Select } from '../components/primitives/Select'
import { Tabs } from '../components/primitives/Tabs'
import { useTableState } from '../utils/useTableState'
import {
  useApplyImportMutation,
  useCreateImportMutation,
  useImportJobQuery,
  useImportJobsQuery,
  useImportRowsQuery,
  usePreviewImportMutation,
} from '../features/imports/hooks'
import type { ImportJob, ImportJobStatus, ImportRowResult } from '../types/imports'
import { getDownloadLink } from '../api/services/filesService'
import { formatDateTime } from '../utils/format'
import { useToast } from '../components/patterns/useToast'
import { useMediaQuery } from '../utils/useMediaQuery'
import { Card } from '../components/primitives/Card'

const rowTabs = [
  { id: 'all', label: 'All Rows' },
  { id: 'errors', label: 'Errors Only' },
]

type ImportWizardStep = 'upload' | 'preview' | 'apply'

const terminalStatuses: ImportJobStatus[] = ['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED']

export default function ImportsPage() {
  const navigate = useNavigate()
  const params = useParams<{ importJobId: string }>()
  const selectedId = params.importJobId ? Number(params.importJobId) : undefined
  const table = useTableState()
  const [typeFilter, setTypeFilter] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<ImportWizardStep>('upload')
  const [importType, setImportType] = useState('Employees Import')
  const [file, setFile] = useState<File | null>(null)
  const [jobForWizard, setJobForWizard] = useState<number | null>(null)
  const [rowTab, setRowTab] = useState('all')
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idem-${Date.now()}`)
  const { showToast } = useToast()
  const isDesktop = useMediaQuery('(min-width: 1280px)')

  const jobsQuery = useImportJobsQuery({ page: table.page, pageSize: table.pageSize, type: typeFilter || undefined, search: table.search || undefined })
  const selectedJobBase = jobsQuery.data?.items.find((item) => item.id === selectedId) ?? null
  const selectedJobQuery = useImportJobQuery(selectedId, Boolean(selectedId))
  const selectedJob = selectedJobQuery.data ?? selectedJobBase ?? null
  const rowsQuery = useImportRowsQuery(selectedId, rowTab === 'errors')

  const wizardJobQuery = useImportJobQuery(jobForWizard ?? undefined, Boolean(jobForWizard))
  const createMutation = useCreateImportMutation()
  const previewMutation = usePreviewImportMutation()
  const applyMutation = useApplyImportMutation()

  useEffect(() => {
    if (!isDesktop || selectedId || jobsQuery.isLoading) return
    const first = jobsQuery.data?.items[0]
    if (first) {
      navigate(`/imports/${first.id}`, { replace: true })
    }
  }, [isDesktop, jobsQuery.data?.items, jobsQuery.isLoading, navigate, selectedId])

  useEffect(() => {
    if (!wizardJobQuery.data || wizardStep !== 'apply') return
    if (terminalStatuses.includes(wizardJobQuery.data.status)) {
      showToast(`Import finished with status ${wizardJobQuery.data.status}.`, wizardJobQuery.data.status === 'FAILED' ? 'error' : 'success')
    }
  }, [showToast, wizardJobQuery.data, wizardStep])

  const columns: DataTableColumn<ImportJob>[] = [
    { key: 'type', label: 'Type', render: (row) => row.importType },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdBy', label: 'Created By', render: (row) => row.createdBy },
    { key: 'createdAt', label: 'Created At', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => <Button onClick={() => navigate(`/imports/${row.id}`)}>View</Button>,
    },
  ]

  const rowColumns: DataTableColumn<ImportRowResult>[] = [
    { key: 'row', label: 'Row #', render: (row) => row.rowNumber },
    { key: 'action', label: 'Action', render: (row) => row.action },
    { key: 'error', label: 'Error Code', render: (row) => row.errorCode ?? '-' },
    { key: 'message', label: 'Message', render: (row) => row.message },
  ]

  const detailContent = selectedJob ? (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Import #{selectedJob.id}</h2>
        <p className="text-sm text-slate-400">{selectedJob.importType}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={selectedJob.status} />
        <Button
          disabled={!selectedJob.sourceFileId}
          onClick={async () => {
            if (!selectedJob.sourceFileId) return
            const url = await getDownloadLink(selectedJob.sourceFileId)
            window.open(url, '_blank', 'noopener,noreferrer')
          }}
        >
          Download Source
        </Button>
        <Button
          disabled={!selectedJob.errorReportFileId}
          onClick={async () => {
            if (!selectedJob.errorReportFileId) return
            const url = await getDownloadLink(selectedJob.errorReportFileId)
            window.open(url, '_blank', 'noopener,noreferrer')
          }}
        >
          Download Error Report
        </Button>
      </div>
      <Card title="Job Summary">
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-400">Created</dt><dd>{selectedJob.summaryCreated}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Updated</dt><dd>{selectedJob.summaryUpdated}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Skipped</dt><dd>{selectedJob.summarySkipped}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Errors</dt><dd>{selectedJob.summaryErrors}</dd></div>
        </dl>
      </Card>
      <Tabs items={rowTabs} activeId={rowTab} onChange={setRowTab} />
      <DataTable
        columns={rowColumns}
        rows={rowsQuery.data ?? []}
        loading={rowsQuery.isLoading}
        page={1}
        pageSize={rowsQuery.data?.length || 1}
        total={rowsQuery.data?.length ?? 0}
        onPageChange={() => undefined}
      />
    </div>
  ) : (
    <Card><p className="text-sm text-slate-400">Select an import job to inspect details.</p></Card>
  )

  const openWizard = () => {
    setWizardOpen(true)
    setWizardStep('upload')
    setImportType('Employees Import')
    setFile(null)
    setJobForWizard(null)
    setIdempotencyKey(`idem-${Date.now()}`)
    previewMutation.reset()
  }

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
                setTypeFilter('')
              }}
              actions={
                <Button variant="primary" onClick={openWizard}>
                  New Import
                </Button>
              }
            >
              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="">All types</option>
                <option value="Employees Import">Employees Import</option>
                <option value="Assets Import">Assets Import</option>
              </Select>
            </FilterBar>
            <DataTable
              title="Imports"
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
        detail={isDesktop ? detailContent : <p className="text-sm text-slate-400">Open a job to view details on mobile.</p>}
      />

      <Drawer open={!isDesktop && Boolean(selectedJob)} title={`Import #${selectedJob?.id ?? ''}`} onClose={() => navigate('/imports')}>
        {detailContent}
      </Drawer>

      <Dialog open={wizardOpen} title="Import XLSX" onClose={() => setWizardOpen(false)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className={wizardStep === 'upload' ? 'text-signal-100' : 'text-slate-400'}>1. Upload</span>
            <span className={wizardStep === 'preview' ? 'text-signal-100' : 'text-slate-400'}>2. Preview</span>
            <span className={wizardStep === 'apply' ? 'text-signal-100' : 'text-slate-400'}>3. Apply</span>
          </div>

          {wizardStep === 'upload' ? (
            <>
              <FormField label="Import Type">
                <Select value={importType} onChange={(event) => setImportType(event.target.value)}>
                  <option>Employees Import</option>
                  <option>Assets Import</option>
                </Select>
              </FormField>
              <FormField label="XLSX File">
                <Input type="file" accept=".xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setWizardOpen(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={createMutation.isPending}
                  onClick={async () => {
                    if (!file) {
                      showToast('Please select a file', 'error')
                      return
                    }
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('importType', importType)
                    try {
                      const result = await createMutation.mutateAsync(formData)
                      setJobForWizard(result.importJobId)
                      const preview = await previewMutation.mutateAsync(result.importJobId)
                      showToast(`Import job #${result.importJobId} uploaded and previewed.`, 'success')
                      setWizardStep('preview')
                      navigate(`/imports/${result.importJobId}`)
                      if (preview.sampleRows.length === 0) {
                        showToast('Preview has no rows.', 'info')
                      }
                    } catch (error) {
                      showToast((error as { message?: string }).message ?? 'Import upload failed', 'error')
                    }
                  }}
                >
                  Upload & Preview
                </Button>
              </div>
            </>
          ) : null}

          {wizardStep === 'preview' ? (
            <>
              <Card title="Preview Summary">
                <p className="text-sm text-slate-300">
                  Created: {previewMutation.data?.summary.summaryCreated ?? 0}, Updated: {previewMutation.data?.summary.summaryUpdated ?? 0}, Skipped:{' '}
                  {previewMutation.data?.summary.summarySkipped ?? 0}, Errors: {previewMutation.data?.summary.summaryErrors ?? 0}
                </p>
              </Card>
              <FormField label="Idempotency Key">
                <Input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />
              </FormField>
              <DataTable
                title="Sample Rows"
                columns={rowColumns}
                rows={previewMutation.data?.sampleRows ?? []}
                page={1}
                pageSize={previewMutation.data?.sampleRows.length || 1}
                total={previewMutation.data?.sampleRows.length ?? 0}
                onPageChange={() => undefined}
              />
              <div className="flex justify-end gap-2">
                <Button onClick={() => setWizardOpen(false)}>Close</Button>
                <Button
                  variant="primary"
                  disabled={applyMutation.isPending || !jobForWizard || !idempotencyKey.trim()}
                  onClick={async () => {
                    if (!jobForWizard) return
                    try {
                      await applyMutation.mutateAsync({ id: jobForWizard, key: idempotencyKey.trim() })
                      showToast('Import apply accepted. Polling job status...', 'success')
                      setWizardStep('apply')
                    } catch (error) {
                      showToast((error as { message?: string }).message ?? 'Apply failed', 'error')
                    }
                  }}
                >
                  Apply Import
                </Button>
              </div>
            </>
          ) : null}

          {wizardStep === 'apply' ? (
            <>
              <Card title="Apply Status">
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-400">Job ID</dt><dd>{jobForWizard ?? '-'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd>{wizardJobQuery.data?.status ?? 'APPLYING'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Errors</dt><dd>{wizardJobQuery.data?.summaryErrors ?? '-'}</dd></div>
                </dl>
              </Card>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setWizardOpen(false)}>Close</Button>
                <Button
                  disabled={!wizardJobQuery.data?.errorReportFileId}
                  onClick={async () => {
                    if (!wizardJobQuery.data?.errorReportFileId) return
                    const url = await getDownloadLink(wizardJobQuery.data.errorReportFileId)
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  Download Error Report
                </Button>
                <Button
                  variant="primary"
                  disabled={!jobForWizard}
                  onClick={() => {
                    if (!jobForWizard) return
                    navigate(`/imports/${jobForWizard}`)
                    setWizardOpen(false)
                  }}
                >
                  Open Job Details
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Dialog>
    </>
  )
}
