import { useMemo, useState } from 'react'
import { Card } from '../components/primitives/Card'
import { Select } from '../components/primitives/Select'
import { Button } from '../components/primitives/Button'
import { DataTable, type DataTableColumn } from '../components/patterns/DataTable'
import { Dialog } from '../components/primitives/Dialog'
import { FormField } from '../components/patterns/FormField'
import { Input } from '../components/primitives/Input'
import { useReferenceDataQuery } from '../features/reference/hooks'
import {
  useAttributesQuery,
  useCreateAttributeMutation,
  useCreateEnumOptionMutation,
  useDisableAttributeMutation,
  useDisableEnumOptionMutation,
  useEnumOptionsQuery,
  useUpdateAttributeMutation,
} from '../features/attributes/hooks'
import type { AttributeValueType } from '../types/attributes'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { useToast } from '../components/patterns/useToast'

export default function AttributeAdminPage() {
  const [groupId, setGroupId] = useState<number | null>(null)
  const [activeAttributeId, setActiveAttributeId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [optionOpen, setOptionOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [valueType, setValueType] = useState<AttributeValueType>('STRING')
  const [required, setRequired] = useState(false)
  const [optionValue, setOptionValue] = useState('')
  const { showToast } = useToast()

  const reference = useReferenceDataQuery()
  const selectedGroupId = groupId ?? reference.groups.data?.[0]?.id ?? null
  const attributesQuery = useAttributesQuery(selectedGroupId ?? undefined)
  const selectedAttribute = attributesQuery.data?.find((item) => item.id === activeAttributeId) ?? null
  const enumOptionsQuery = useEnumOptionsQuery(selectedAttribute?.valueType === 'ENUM' ? selectedAttribute.id : undefined)
  const createMutation = useCreateAttributeMutation()
  const updateMutation = useUpdateAttributeMutation()
  const disableMutation = useDisableAttributeMutation()
  const createOptionMutation = useCreateEnumOptionMutation()
  const disableOptionMutation = useDisableEnumOptionMutation()

  const columns: DataTableColumn<NonNullable<typeof attributesQuery.data>[number]>[] = [
    { key: 'label', label: 'Label', render: (row) => row.label },
    { key: 'type', label: 'Value Type', render: (row) => row.valueType },
    { key: 'required', label: 'Required', render: (row) => <StatusBadge status={row.required ? 'REQUIRED' : 'OPTIONAL'} /> },
    { key: 'enabled', label: 'Status', render: (row) => <StatusBadge status={row.enabled ? 'ACTIVE' : 'DISABLED'} /> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setActiveAttributeId(row.id)}>Select</Button>
          <Button
            onClick={async () => {
              try {
                await updateMutation.mutateAsync({ id: row.id, payload: { label: `${row.label} (Edited)`, required: !row.required } })
                showToast('Attribute updated', 'success')
              } catch (error) {
                showToast((error as { message?: string }).message ?? 'Update failed', 'error')
              }
            }}
          >
            Quick Edit
          </Button>
          <Button
            onClick={async () => {
              await disableMutation.mutateAsync(row.id)
              showToast('Attribute disabled', 'success')
            }}
          >
            Disable
          </Button>
        </div>
      ),
    },
  ]

  const enumColumns: DataTableColumn<NonNullable<typeof enumOptionsQuery.data>[number]>[] = [
    { key: 'value', label: 'Option', render: (row) => row.value },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.enabled ? 'ACTIVE' : 'DISABLED'} /> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <Button
          onClick={async () => {
            await disableOptionMutation.mutateAsync(row.id)
            showToast('Option disabled', 'success')
          }}
        >
          Disable
        </Button>
      ),
    },
  ]

  const summary = useMemo(() => {
    if (!selectedAttribute) return 'Select an attribute to manage enum options.'
    return selectedAttribute.valueType === 'ENUM'
      ? `ENUM options for "${selectedAttribute.label}"`
      : `Selected attribute "${selectedAttribute.label}" is ${selectedAttribute.valueType}.`
  }, [selectedAttribute])

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card title="Group Selector">
          <FormField label="Group">
            <Select value={selectedGroupId ?? ''} onChange={(event) => setGroupId(Number(event.target.value))}>
              {reference.groups.data?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </FormField>
          <Button className="mt-3 w-full" variant="primary" onClick={() => setCreateOpen(true)}>
            Create Attribute
          </Button>
        </Card>
        <Card title="Attributes">
          <DataTable
            columns={columns}
            rows={attributesQuery.data ?? []}
            loading={attributesQuery.isLoading}
            page={1}
            pageSize={Math.max(1, attributesQuery.data?.length ?? 1)}
            total={attributesQuery.data?.length ?? 0}
            onPageChange={() => undefined}
          />
        </Card>
      </div>

      <Card title="Enum Options">
        <p className="mb-3 text-sm text-slate-300">{summary}</p>
        <Button
          disabled={!selectedAttribute || selectedAttribute.valueType !== 'ENUM'}
          onClick={() => setOptionOpen(true)}
          variant="primary"
          className="mb-3"
        >
          Add Enum Option
        </Button>
        <DataTable
          columns={enumColumns}
          rows={enumOptionsQuery.data ?? []}
          loading={enumOptionsQuery.isLoading}
          page={1}
          pageSize={Math.max(1, enumOptionsQuery.data?.length ?? 1)}
          total={enumOptionsQuery.data?.length ?? 0}
          onPageChange={() => undefined}
        />
      </Card>

      <Dialog open={createOpen} title="Create Attribute Definition" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <FormField label="Label">
            <Input value={label} onChange={(event) => setLabel(event.target.value)} />
          </FormField>
          <FormField label="Value Type">
            <Select value={valueType} onChange={(event) => setValueType(event.target.value as AttributeValueType)}>
              <option value="INTEGER">INTEGER</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="STRING">STRING</option>
              <option value="ENUM">ENUM</option>
              <option value="EMPLOYEE_REF">EMPLOYEE_REF</option>
            </Select>
          </FormField>
          <FormField label="Required">
            <Select value={String(required)} onChange={(event) => setRequired(event.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!selectedGroupId) return
                try {
                  await createMutation.mutateAsync({ groupId: selectedGroupId, label, valueType, required })
                  showToast('Attribute created', 'success')
                  setCreateOpen(false)
                  setLabel('')
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

      <Dialog open={optionOpen} title="Add Enum Option" onClose={() => setOptionOpen(false)}>
        <div className="space-y-3">
          <FormField label="Option Value">
            <Input value={optionValue} onChange={(event) => setOptionValue(event.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOptionOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!selectedAttribute) return
                await createOptionMutation.mutateAsync({ attributeId: selectedAttribute.id, value: optionValue })
                showToast('Enum option added', 'success')
                setOptionOpen(false)
                setOptionValue('')
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
