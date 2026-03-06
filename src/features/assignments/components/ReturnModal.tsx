import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog } from '../../../components/primitives/Dialog'
import { FormField } from '../../../components/patterns/FormField'
import { Select } from '../../../components/primitives/Select'
import { Textarea } from '../../../components/primitives/Textarea'
import { Button } from '../../../components/primitives/Button'
import { useReferenceDataQuery } from '../../reference/hooks'
import { useAssignmentDetailQuery, useReturnAssignmentMutation } from '../hooks'
import { fetchAssignment } from '../../../api/services/assignmentsService'
import { queryKeys } from '../../common/queryKeys'
import { invalidateLifecycleQueries } from '../../common/lifecycleInvalidation'

interface ReturnModalProps {
  open: boolean
  onClose: () => void
  assignmentId?: number | null
  onReturned?: (payload: { assignmentId: number; assetId?: number; employeeId?: number }) => void
}

export function ReturnModal({ open, onClose, assignmentId, onReturned }: ReturnModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [returnReasonId, setReturnReasonId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [alreadyReturned, setAlreadyReturned] = useState(false)

  const reference = useReferenceDataQuery()
  const detail = useAssignmentDetailQuery(assignmentId ?? undefined)
  const mutation = useReturnAssignmentMutation()

  const enabledReturnReasons = useMemo(
    () => (reference.returnReasons.data ?? []).filter((item) => item.enabled),
    [reference.returnReasons.data],
  )
  const selectedReason = enabledReturnReasons.find((item) => item.id === returnReasonId)
  const computedNextStatus = selectedReason ? (selectedReason.isMalfunction ? 'UNDER_SERVICE' : 'IN_STOCK') : '-'

  const submit = async () => {
    if (!assignmentId) {
      setErrorMessage('Assignment is required.')
      return
    }
    if (!returnReasonId || !notes.trim()) {
      setErrorMessage('Return reason and notes are required.')
      return
    }

    setErrorMessage('')

    try {
      await mutation.mutateAsync({
        id: assignmentId,
        payload: {
          returnReasonId,
          notes: notes.trim(),
        },
      })
      const latest = await queryClient.fetchQuery({
        queryKey: queryKeys.assignment.byId(assignmentId),
        queryFn: () => fetchAssignment(assignmentId),
      })
      await invalidateLifecycleQueries(queryClient, {
        assignmentId,
        assetId: latest.assetId,
        employeeId: latest.employeeId,
      })
      onReturned?.({
        assignmentId,
        assetId: latest.assetId,
        employeeId: latest.employeeId,
      })
      onClose()
    } catch (error) {
      const normalized = error as { status?: number; message?: string }
      if (normalized.status === 409 && assignmentId) {
        setAlreadyReturned(true)
        setErrorMessage('This assignment is already returned. Showing latest state.')
        const latest = await queryClient.fetchQuery({
          queryKey: queryKeys.assignment.byId(assignmentId),
          queryFn: () => fetchAssignment(assignmentId),
        })
        await invalidateLifecycleQueries(queryClient, {
          assignmentId,
          assetId: latest.assetId,
          employeeId: latest.employeeId,
        })
      } else {
        setErrorMessage(normalized.message ?? 'Failed to return assignment.')
      }
    }
  }

  if (!open) return null

  return (
    <Dialog open title="Return Asset" onClose={onClose}>
      <div className="space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-slate-400">Assignment</dt>
            <dd>#{detail.data?.id ?? assignmentId ?? '-'}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-slate-400">Asset</dt>
            <dd>{detail.data?.assetInventoryNumber ?? '-'}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-2">
            <dt className="text-slate-400">Employee</dt>
            <dd>{detail.data?.employeeFullName ?? '-'}</dd>
          </div>
        </dl>
        <FormField label="Return Reason">
          <Select value={returnReasonId ?? ''} onChange={(event) => setReturnReasonId(event.target.value ? Number(event.target.value) : null)}>
            <option value="">Select reason</option>
            {enabledReturnReasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.reasonText}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Notes">
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        <FormField label="Asset Status After Return">
          <input
            value={computedNextStatus}
            readOnly
            className="w-full rounded-xl border border-border bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
        </FormField>
        {errorMessage ? <p className="text-sm font-medium text-rose-300">{errorMessage}</p> : null}
        {alreadyReturned && assignmentId ? (
          <Button
            variant="secondary"
            onClick={() => {
              navigate(`/assignments/${assignmentId}`)
              onClose()
            }}
          >
            Open Assignment
          </Button>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Returning...' : 'Confirm Return'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
