import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { useTableState } from '../utils/useTableState'
import { useAuditEventsQuery } from '../features/logs/hooks'
import type { AuditEvent } from '../types/audit'
import { formatDateTime } from '../utils/format'

export default function AuditEventsPage() {
  const table = useTableState()
  const query = useAuditEventsQuery({ page: table.page, pageSize: table.pageSize, search: table.search || undefined })
  const columns: DataTableColumn<AuditEvent>[] = [
    { key: 'eventType', label: 'Event Type', render: (row) => row.eventType },
    { key: 'entityType', label: 'Entity Type', render: (row) => row.entityType },
    { key: 'entityId', label: 'Entity ID', render: (row) => row.entityId },
    { key: 'actor', label: 'Actor', render: (row) => row.actor },
    { key: 'at', label: 'At', render: (row) => formatDateTime(row.at) },
  ]

  return (
    <div className="space-y-4">
      <FilterBar searchValue={table.search} onSearchChange={table.setSearch} onReset={table.reset} />
      <DataTable
        title="Audit Events"
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={table.page}
        pageSize={table.pageSize}
        total={query.data?.total ?? 0}
        onPageChange={table.setPage}
      />
    </div>
  )
}
