import { useMemo, useState } from 'react'
import { Card } from '../components/primitives/Card'
import { Tabs } from '../components/primitives/Tabs'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { Button } from '../components/primitives/Button'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { Select } from '../components/primitives/Select'
import { useCreateReferenceMutation, useDisableReferenceMutation, useReferenceDataQuery, useUpdateReferenceMutation } from '../features/reference/hooks'
import { useToast } from '../components/patterns/useToast'
import type { AssetGroup, Category, Location, Position, ReturnReason } from '../types/reference'
import { StatusBadge } from '../components/primitives/StatusBadge'

type ReferenceItem = AssetGroup | Category | Location | Position | ReturnReason
type TabId = 'groups' | 'categories' | 'locations' | 'positions' | 'return-reasons'

const tabs = [
  { id: 'groups', label: 'Groups' },
  { id: 'categories', label: 'Categories' },
  { id: 'locations', label: 'Locations' },
  { id: 'positions', label: 'Positions' },
  { id: 'return-reasons', label: 'Return Reasons' },
] as const

const endpointMap: Record<TabId, string> = {
  groups: '/api/reference/groups',
  categories: '/api/reference/categories',
  locations: '/api/reference/locations',
  positions: '/api/reference/positions',
  'return-reasons': '/api/reference/return-reasons',
}

export default function ReferenceDataAdminPage() {
  const [tab, setTab] = useState<TabId>('groups')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ReferenceItem | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState<number | null>(null)
  const [isMalfunction, setIsMalfunction] = useState(false)
  const data = useReferenceDataQuery()
  const createMutation = useCreateReferenceMutation()
  const updateMutation = useUpdateReferenceMutation()
  const disableMutation = useDisableReferenceMutation()
  const { showToast } = useToast()

  const items = useMemo<ReferenceItem[]>(() => {
    if (tab === 'groups') return data.groups.data ?? []
    if (tab === 'categories') return data.categories.data ?? []
    if (tab === 'locations') return data.locations.data ?? []
    if (tab === 'positions') return data.positions.data ?? []
    return data.returnReasons.data ?? []
  }, [data.categories.data, data.groups.data, data.locations.data, data.positions.data, data.returnReasons.data, tab])

  const openCreate = () => {
    setEditing(null)
    setCode('')
    setName('')
    setGroupId(data.groups.data?.[0]?.id ?? null)
    setIsMalfunction(false)
    setModalOpen(true)
  }

  const columns: DataTableColumn<ReferenceItem>[] = [
    { key: 'id', label: 'ID', render: (row) => row.id },
    { key: 'code', label: 'Code', render: (row) => ('code' in row ? row.code : '-') },
    { key: 'name', label: 'Name', render: (row) => ('name' in row ? row.name : 'reasonText' in row ? row.reasonText : '-') },
    {
      key: 'extra',
      label: 'Extra',
      render: (row) => {
        if ('groupName' in row) return row.groupName
        if ('isMalfunction' in row) return row.isMalfunction ? 'Malfunction' : 'Regular'
        return '-'
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.enabled ? 'ACTIVE' : 'DISABLED'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setEditing(row)
              setCode('code' in row ? row.code : '')
              setName('name' in row ? row.name : 'reasonText' in row ? row.reasonText : '')
              setGroupId('groupId' in row ? row.groupId : null)
              setIsMalfunction('isMalfunction' in row ? row.isMalfunction : false)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Button
            onClick={async () => {
              try {
                await disableMutation.mutateAsync({ endpoint: endpointMap[tab], id: row.id })
                showToast('Record disabled', 'success')
              } catch (error) {
                showToast((error as { message?: string }).message ?? 'Disable failed', 'error')
              }
            }}
          >
            Disable
          </Button>
        </div>
      ),
    },
  ]

  const saveRecord = async () => {
    try {
      const endpoint = endpointMap[tab]
      const payload = {
        code: code || undefined,
        name: name || undefined,
        reasonText: tab === 'return-reasons' ? name : undefined,
        isMalfunction: tab === 'return-reasons' ? isMalfunction : undefined,
        groupId: tab === 'categories' ? groupId ?? undefined : undefined,
      }
      if (editing) {
        await updateMutation.mutateAsync({ endpoint, id: editing.id, payload })
        showToast('Record updated', 'success')
      } else {
        await createMutation.mutateAsync({ endpoint, payload })
        showToast('Record created', 'success')
      }
      setModalOpen(false)
    } catch (error) {
      showToast((error as { message?: string }).message ?? 'Save failed', 'error')
    }
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Tabs items={tabs as unknown as { id: string; label: string }[]} activeId={tab} onChange={(value) => setTab(value as TabId)} />
          <Button variant="primary" onClick={openCreate}>
            New {tabs.find((item) => item.id === tab)?.label}
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={items}
          loading={false}
          page={1}
          pageSize={Math.max(1, items.length)}
          total={items.length}
          onPageChange={() => undefined}
        />
      </Card>

      <Dialog open={modalOpen} title={editing ? 'Edit Record' : 'Create Record'} onClose={() => setModalOpen(false)}>
        <div className="space-y-3">
          {tab !== 'groups' ? (
            <FormField label="Code">
              <Input value={code} onChange={(event) => setCode(event.target.value)} disabled={Boolean(editing)} />
            </FormField>
          ) : null}
          <FormField label={tab === 'return-reasons' ? 'Reason Text' : 'Name'}>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          {tab === 'categories' ? (
            <FormField label="Group">
              <Select value={groupId ?? ''} onChange={(event) => setGroupId(Number(event.target.value))}>
                {data.groups.data?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
          {tab === 'return-reasons' ? (
            <FormField label="Is Malfunction">
              <Select value={String(isMalfunction)} onChange={(event) => setIsMalfunction(event.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormField>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveRecord}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
