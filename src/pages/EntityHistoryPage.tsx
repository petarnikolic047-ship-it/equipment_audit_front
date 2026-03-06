import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { Select } from '../components/primitives/Select'
import { Input } from '../components/primitives/Input'
import { SplitPane } from '../components/patterns/SplitPane'
import { useTableState } from '../utils/useTableState'
import { useEntityHistoryQuery } from '../features/history/hooks'
import type { EntityHistoryRecord } from '../types/history'
import { formatDateTime } from '../utils/format'
import { JsonDiffViewer } from '../components/patterns/JsonDiffViewer'
import { Card } from '../components/primitives/Card'

export default function EntityHistoryPage() {
  const table = useTableState()
  const [entityType, setEntityType] = useState('')
  const [entityPk, setEntityPk] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const fromValue = fromDate ? `${fromDate}T00:00:00.000Z` : undefined
  const toValue = toDate ? `${toDate}T23:59:59.999Z` : undefined

  const query = useEntityHistoryQuery({
    page: table.page,
    pageSize: table.pageSize,
    search: table.search || undefined,
    entityType: entityType || undefined,
    entityPk: entityPk || undefined,
    from: fromValue,
    to: toValue,
  })

  const effectiveSelectedId = selectedId ?? query.data?.items[0]?.id ?? null
  const selected = useMemo(
    () => query.data?.items.find((item) => item.id === effectiveSelectedId) ?? null,
    [effectiveSelectedId, query.data?.items],
  )

  const columns: DataTableColumn<EntityHistoryRecord>[] = [
    { key: 'entityType', label: 'Entity Type', render: (row) => row.entityType },
    { key: 'entityPk', label: 'Entity PK', render: (row) => row.entityPk },
    { key: 'operation', label: 'Operation', render: (row) => row.operation },
    { key: 'changedAt', label: 'Changed At', render: (row) => formatDateTime(row.changedAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button type="button" className="text-sm font-medium text-signal-100" onClick={() => setSelectedId(row.id)}>
          View Diff
        </button>
      ),
    },
  ]

  return (
    <SplitPane
      list={
        <>
          <FilterBar
            searchValue={table.search}
            onSearchChange={table.setSearch}
            onReset={() => {
              table.reset()
              setEntityType('')
              setEntityPk('')
              setFromDate('')
              setToDate('')
              setSelectedId(null)
            }}
          >
            <Select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
              <option value="">All entities</option>
              <option value="ASSET">ASSET</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="ASSIGNMENT">ASSIGNMENT</option>
              <option value="CATEGORY">CATEGORY</option>
              <option value="IMPORT_JOB">IMPORT_JOB</option>
            </Select>
            <Input placeholder="Entity PK" value={entityPk} onChange={(event) => setEntityPk(event.target.value)} />
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </FilterBar>
          <DataTable
            title="Entity History"
            columns={columns}
            rows={query.data?.items ?? []}
            loading={query.isLoading}
            page={table.page}
            pageSize={table.pageSize}
            total={query.data?.total ?? 0}
            onPageChange={table.setPage}
          />
        </>
      }
      detail={
        selected ? (
          <div className="space-y-3">
            <Card>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-100">Revision #{selected.auditRevisionId}</p>
                <p className="text-slate-300">
                  {selected.entityType} #{selected.entityPk} - {selected.operation}
                </p>
                <p className="text-xs text-slate-400">{formatDateTime(selected.changedAt)}</p>
              </div>
            </Card>
            <JsonDiffViewer oldJson={selected.oldRowJson} newJson={selected.newRowJson} />
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-400">Select a history row to view JSON diff.</p>
          </Card>
        )
      }
    />
  )
}
