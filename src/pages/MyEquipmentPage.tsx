import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { Card } from '../components/primitives/Card'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { useToast } from '../components/patterns/useToast'
import { useAuthStore } from '../features/auth/authStore'
import { useMyEquipmentQuery } from '../features/selfService/hooks'
import type { MyEquipmentRecord } from '../types/assetOps'
import { formatDateTime } from '../utils/format'
import { getDownloadLink } from '../api/services/filesService'

export default function MyEquipmentPage() {
  const userInfo = useAuthStore((state) => state.userInfo)
  const { showToast } = useToast()
  const query = useMyEquipmentQuery(userInfo?.employeeId ?? undefined)

  const columns: DataTableColumn<MyEquipmentRecord>[] = [
    { key: 'inventoryNumber', label: 'Inventory', render: (row) => row.inventoryNumber },
    { key: 'assetName', label: 'Asset', render: (row) => row.assetName },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'takenAt', label: 'Taken At', render: (row) => formatDateTime(row.takenAt) },
    { key: 'returnedAt', label: 'Returned At', render: (row) => formatDateTime(row.returnedAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={!row.reversFileId}
            onClick={async () => {
              if (!row.reversFileId) return
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
    <div className="space-y-4">
      <Card title="My Equipment">
        <p className="text-sm text-slate-300">
          Scope is limited to your employee account. You can review currently assigned assets, full assignment history, and revers files.
        </p>
      </Card>
      <DataTable
        title="Current Assets"
        columns={columns}
        rows={query.data?.current ?? []}
        loading={query.isLoading}
        page={1}
        pageSize={Math.max(1, query.data?.current.length ?? 1)}
        total={query.data?.current.length ?? 0}
        onPageChange={() => showToast('Current assets table is single-page in MVP demo.', 'success')}
      />
      <DataTable
        title="History"
        columns={columns}
        rows={query.data?.history ?? []}
        loading={query.isLoading}
        page={1}
        pageSize={Math.max(1, query.data?.history.length ?? 1)}
        total={query.data?.history.length ?? 0}
        onPageChange={() => showToast('History table is single-page in MVP demo.', 'success')}
      />
    </div>
  )
}
