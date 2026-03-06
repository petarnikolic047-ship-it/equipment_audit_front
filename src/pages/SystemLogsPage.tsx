import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { FilterBar } from '../components/patterns/FilterBar'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { useSystemLogsQuery } from '../features/logs/hooks'
import { useTableState } from '../utils/useTableState'
import type { SystemLog } from '../types/audit'
import { formatDateTime } from '../utils/format'

export default function SystemLogsPage() {
  const table = useTableState()
  const query = useSystemLogsQuery({ page: table.page, pageSize: table.pageSize, search: table.search || undefined })
  const columns: DataTableColumn<SystemLog>[] = [
    { key: 'severity', label: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
    { key: 'message', label: 'Message', render: (row) => row.message },
    { key: 'requestId', label: 'Request ID', render: (row) => row.requestId },
    { key: 'at', label: 'Timestamp', render: (row) => formatDateTime(row.at) },
  ]

  return (
    <div className="space-y-4">
      <FilterBar searchValue={table.search} onSearchChange={table.setSearch} onReset={table.reset} />
      <DataTable
        title="System Logs"
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
