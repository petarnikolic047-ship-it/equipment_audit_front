import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog } from '../../../components/primitives/Dialog'
import { FormField } from '../../../components/patterns/FormField'
import { Input } from '../../../components/primitives/Input'
import { Select } from '../../../components/primitives/Select'
import { Textarea } from '../../../components/primitives/Textarea'
import { Button } from '../../../components/primitives/Button'
import { useAssetsQuery } from '../../assets/hooks'
import { useEmployeesQuery } from '../../employees/hooks'
import { useCreateAssignmentMutation } from '../hooks'
import { getDownloadLink } from '../../../api/services/filesService'
import { fetchAssignments } from '../../../api/services/assignmentsService'
import { queryKeys } from '../../common/queryKeys'
import { invalidateLifecycleQueries } from '../../common/lifecycleInvalidation'
import type { Assignment } from '../../../types/assignment'

interface AssignModalProps {
  open: boolean
  onClose: () => void
  defaultAssetId?: number | null
  defaultEmployeeId?: number | null
  lockAsset?: boolean
  lockEmployee?: boolean
  onAssigned?: (payload: { assignmentId: number; fileId: number; assetId: number; employeeId: number }) => void
}

const steps = ['Employee', 'Asset', 'Handover', 'Confirm'] as const

function resolveInitialStep(defaultEmployeeId: number | null, defaultAssetId: number | null) {
  if (defaultEmployeeId) return defaultAssetId ? 3 : 2
  return 1
}

export function AssignModal({
  open,
  onClose,
  defaultAssetId = null,
  defaultEmployeeId = null,
  lockAsset = false,
  lockEmployee = false,
  onAssigned,
}: AssignModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const initialStep = resolveInitialStep(defaultEmployeeId, defaultAssetId)
  const [step, setStep] = useState(initialStep)
  const [assetId, setAssetId] = useState<number | null>(defaultAssetId)
  const [employeeId, setEmployeeId] = useState<number | null>(defaultEmployeeId)
  const [notes, setNotes] = useState('')
  const [assetSearch, setAssetSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [handoverLocation, setHandoverLocation] = useState('')
  const [expectedDueDate, setExpectedDueDate] = useState('')
  const [conflictAssignment, setConflictAssignment] = useState<Assignment | null>(null)
  const [conflictMessage, setConflictMessage] = useState('')
  const [successState, setSuccessState] = useState<{
    assignmentId: number
    fileId: number
    assetId: number
    employeeId: number
  } | null>(null)

  const assetsQuery = useAssetsQuery({
    page: 1,
    pageSize: 500,
    active: true,
    search: assetSearch || undefined,
  })
  const employeesQuery = useEmployeesQuery({
    page: 1,
    pageSize: 500,
    active: true,
    search: employeeSearch || undefined,
  })
  const createMutation = useCreateAssignmentMutation()

  const availableAssets = useMemo(
    () => (assetsQuery.data?.items ?? []).filter((asset) => asset.isActive && asset.status === 'IN_STOCK'),
    [assetsQuery.data?.items],
  )
  const availableEmployees = useMemo(
    () => (employeesQuery.data?.items ?? []).filter((employee) => employee.isActive),
    [employeesQuery.data?.items],
  )
  const selectedAsset = useMemo(
    () => (assetsQuery.data?.items ?? []).find((asset) => asset.id === assetId) ?? null,
    [assetId, assetsQuery.data?.items],
  )
  const selectedEmployee = useMemo(
    () => (employeesQuery.data?.items ?? []).find((employee) => employee.id === employeeId) ?? null,
    [employeeId, employeesQuery.data?.items],
  )

  const combinedNotes = [notes.trim(), handoverLocation ? `Handover location: ${handoverLocation.trim()}` : null, expectedDueDate ? `Requested due date: ${expectedDueDate}` : null]
    .filter(Boolean)
    .join(' | ')

  const canNext =
    (step === 1 && Boolean(employeeId)) ||
    (step === 2 && Boolean(assetId)) ||
    (step === 3 && Boolean(handoverLocation.trim()))
  const shouldSkipAssetStep = lockAsset && Boolean(assetId)

  const onSubmit = async () => {
    if (!assetId || !employeeId) {
      setConflictMessage('Asset and employee are required.')
      return
    }

    setConflictAssignment(null)
    setConflictMessage('')

    try {
      const result = await createMutation.mutateAsync({
        assetId,
        employeeId,
        notes: combinedNotes || null,
      })
      setSuccessState({
        assignmentId: result.assignmentId,
        fileId: result.fileId,
        assetId,
        employeeId,
      })
      onAssigned?.({ assignmentId: result.assignmentId, fileId: result.fileId, assetId, employeeId })
    } catch (error) {
      const normalized = error as { status?: number; message?: string }
      if (normalized.status === 409 && assetId) {
        const lookup = await queryClient.fetchQuery({
          queryKey: queryKeys.assignments.list({
            page: 1,
            pageSize: 1,
            activeOnly: 'true',
            assetId,
          }),
          queryFn: () =>
            fetchAssignments({
              page: 1,
              pageSize: 1,
              activeOnly: 'true',
              assetId,
            }),
        })
        const current = lookup.items[0] ?? null
        setConflictAssignment(current)
        setConflictMessage(current ? `Asset is already assigned to ${current.employeeFullName}.` : 'Asset is already assigned.')
        await invalidateLifecycleQueries(queryClient, {
          assetId,
          assignmentId: current?.id,
          employeeId: current?.employeeId,
        })
      } else {
        setConflictMessage(normalized.message ?? 'Failed to create assignment.')
      }
    }
  }

  if (!open) return null

  if (successState) {
    return (
      <Dialog open title="Assign Equipment" onClose={onClose}>
        <div className="space-y-3">
          <p className="text-sm text-slate-200">Assignment created successfully.</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Assignment</dt>
              <dd>#{successState.assignmentId}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Asset</dt>
              <dd>{selectedAsset?.inventoryNumber ?? successState.assetId}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Next Action</dt>
              <dd>Return or Transfer when custody changes</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={async () => {
                const url = await getDownloadLink(successState.fileId)
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
            >
              Download Revers
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/assignments/${successState.assignmentId}`)
                onClose()
              }}
            >
              Open Assignment
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/assets/${successState.assetId}`)
                onClose()
              }}
            >
              Open Asset
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog open title="Assign Equipment" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`brand-display rounded-sm border px-2 py-1 text-center text-[11px] tracking-[0.08em] ${
                step === index + 1
                  ? 'border-signal-500 bg-signal-500/20 text-signal-100'
                  : 'border-white/15 bg-white/5 text-slate-300'
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <>
            <FormField label="Search Employee">
              <Input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Name / phone / JMBG" />
            </FormField>
            <FormField label="Employee">
              <Select
                value={employeeId ?? ''}
                disabled={lockEmployee}
                onChange={(event) => setEmployeeId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Select employee</option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FormField label="Search Asset">
              <Input value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} placeholder="Inventory / name / serial" />
            </FormField>
            <FormField label="Asset">
              <Select
                value={assetId ?? ''}
                disabled={lockAsset}
                onChange={(event) => setAssetId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Select asset</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.inventoryNumber} - {asset.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <FormField label="Handover Location">
              <Input value={handoverLocation} onChange={(event) => setHandoverLocation(event.target.value)} placeholder="Main Office / Workshop / Field" />
            </FormField>
            <FormField label="Requested Due Date (optional)">
              <Input type="date" value={expectedDueDate} onChange={(event) => setExpectedDueDate(event.target.value)} />
            </FormField>
            <FormField label="Notes">
              <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </FormField>
          </>
        ) : null}

        {step === 4 ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Employee</dt>
              <dd>{selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Asset</dt>
              <dd>{selectedAsset ? `${selectedAsset.inventoryNumber} - ${selectedAsset.name}` : '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Handover</dt>
              <dd>{handoverLocation || '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Requested Due Date</dt>
              <dd>{expectedDueDate || '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-white/15 py-2">
              <dt className="text-slate-400">Notes</dt>
              <dd className="max-w-[70%] text-right">{notes || '-'}</dd>
            </div>
          </dl>
        ) : null}

        {conflictMessage ? <p className="text-sm font-medium text-rose-300">{conflictMessage}</p> : null}
        {conflictAssignment ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/assets/${conflictAssignment.assetId}`)
                onClose()
              }}
            >
              Open Asset
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/assignments/${conflictAssignment.id}`)
                onClose()
              }}
            >
              Open Assignment
            </Button>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              if (step === 1) {
                onClose()
                return
              }
              setStep((current) => {
                if (current === 3 && shouldSkipAssetStep) return 1
                return Math.max(1, current - 1)
              })
            }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button
              variant="primary"
              disabled={!canNext}
              onClick={() =>
                setStep((current) => {
                  if (current === 1 && shouldSkipAssetStep) return 3
                  return Math.min(4, current + 1)
                })
              }
            >
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={onSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
