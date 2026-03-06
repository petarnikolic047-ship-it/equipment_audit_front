import { useMemo, useState, type RefObject } from 'react'
import { Card } from '../../../components/primitives/Card'
import { Button } from '../../../components/primitives/Button'
import { Dialog } from '../../../components/primitives/Dialog'
import { StatusBadge } from '../../../components/primitives/StatusBadge'
import { InlineDetailTabs, type InlineDetailTabItem } from '../../../components/primitives/InlineDetailTabs'
import { DetailPanelSkeleton } from '../../../components/patterns/DetailPanelSkeleton'
import { formatDate, formatDateTime, maskJmbg } from '../../../utils/format'
import { useStagedMount } from '../../../utils/useStagedMount'
import type { Employee } from '../../../types/employee'
import type { Assignment } from '../../../types/assignment'

interface EmployeeDetailWorkspaceProps {
  employee: Employee
  activeTab: string
  onTabChange: (tabId: string) => void
  tabIdBase: string
  tabs: InlineDetailTabItem[]
  isDesktop: boolean
  isFullMode: boolean
  isOpen?: boolean
  headerFocusRef?: RefObject<HTMLDivElement>
  onClose?: () => void
  onBackToList?: () => void
  onEdit: () => void
  onDeactivate: () => void
  onOpenAssignment: (assignmentId: number) => void
  onOpenAsset: (assetId: number) => void
  onDownloadRevers: (fileId: number) => void
  onReturn: (assignmentId: number) => void
  overdueAssetsCount: number
  assignedItems: Assignment[]
  historyItems: Assignment[]
}

const heavyTabs = new Set(['assigned-assets', 'history', 'documents'])

function resolveAssetLabel(assignment: Assignment) {
  if (assignment.assetInventoryNumber && assignment.assetName) {
    return `${assignment.assetInventoryNumber} - ${assignment.assetName}`
  }
  return assignment.assetInventoryNumber || assignment.assetName || `Asset #${assignment.assetId}`
}

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-white/15 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8 last:border-b-0">
      <div className="text-sm font-medium leading-6 text-slate-300">{label}</div>
      <div className="break-words text-base font-semibold leading-6 text-slate-100">{value}</div>
    </div>
  )
}

export function EmployeeDetailWorkspace({
  employee,
  activeTab,
  onTabChange,
  tabIdBase,
  tabs,
  isFullMode,
  isOpen = true,
  headerFocusRef,
  onClose,
  onBackToList,
  onEdit,
  onDeactivate,
  onOpenAssignment,
  onOpenAsset,
  onDownloadRevers,
  onReturn,
  overdueAssetsCount,
  assignedItems,
  historyItems,
}: EmployeeDetailWorkspaceProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const shouldStageHeavyPanel = isOpen && heavyTabs.has(activeTab)
  const heavyPanelReady = useStagedMount(shouldStageHeavyPanel, 140)
  const showHeavyPanelSkeleton = shouldStageHeavyPanel && !heavyPanelReady

  const tabPanelId = `${tabIdBase}-panel-${activeTab}`
  const activeTabId = `${tabIdBase}-tab-${activeTab}`
  const hasActiveAssets = Boolean(employee.hasActiveAssignments) || assignedItems.length > 0
  const totalAssignments = historyItems.length
  const assignedPreview = useMemo(() => assignedItems.slice(0, 3), [assignedItems])
  const reversDocs = useMemo(() => historyItems.filter((item) => item.reversFileId), [historyItems])
  const lastActivity = useMemo(() => {
    const timelinePoints = [...assignedItems, ...historyItems].flatMap((item) =>
      [item.takenAt, item.returnedAt].filter(Boolean) as string[],
    )
    if (!timelinePoints.length) return '-'
    const maxTimestamp = timelinePoints.reduce((currentMax, value) => {
      const timestamp = new Date(value).getTime()
      if (Number.isNaN(timestamp)) return currentMax
      return Math.max(currentMax, timestamp)
    }, 0)
    return maxTimestamp > 0 ? formatDateTime(new Date(maxTimestamp).toISOString()) : '-'
  }, [assignedItems, historyItems])

  return (
    <div className="relative bg-black/35 px-3 py-4">
      <div ref={headerFocusRef} tabIndex={-1} className="flex items-start justify-between gap-4 outline-none">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="brand-display truncate text-3xl leading-none text-slate-100">
              {employee.firstName} {employee.lastName}
            </h2>
            <span className="inline-flex items-center rounded-sm border border-white/20 px-2 py-1 text-xs font-semibold text-slate-200">
              {maskJmbg(employee.jmbg)}
            </span>
            <StatusBadge status={employee.isActive ? 'ACTIVE' : 'DISABLED'} />
          </div>
          <p className="mt-1 text-sm text-slate-400">{employee.positionName ?? '-'}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isFullMode && onBackToList ? <Button variant="ghost" onClick={onBackToList}>Back To List</Button> : null}
          {!isFullMode && onClose ? <Button variant="ghost" onClick={onClose}>Close</Button> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={onEdit}>Edit</Button>
          <Button onClick={() => setMoreOpen(true)}>More</Button>
        </div>

        {hasActiveAssets ? (
          <p className="text-sm font-semibold text-amber-300">Warning: employee currently holds active assets.</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/15 bg-black/20 px-4 py-3">
        <p className="text-sm text-slate-200">
          <span className="font-semibold text-slate-300">Employee Context</span>
          <span className="mx-2 text-slate-500">|</span>
          Active assets: <span className="font-semibold">{assignedItems.length}</span>
          <span className="mx-2 text-slate-500">|</span>
          Overdue: <span className="font-semibold">{overdueAssetsCount}</span>
          <span className="mx-2 text-slate-500">|</span>
          Total assignments: <span className="font-semibold">{totalAssignments}</span>
          <span className="mx-2 text-slate-500">|</span>
          Last activity: <span className="font-semibold">{lastActivity}</span>
        </p>
        <Button variant="secondary" onClick={() => onTabChange('assigned-assets')} disabled={!assignedItems.length}>
          View Assigned Assets
        </Button>
      </div>

      <div className="mt-4">
        <InlineDetailTabs idBase={tabIdBase} items={tabs} activeId={activeTab} onChange={onTabChange} />
      </div>

      <div role="tabpanel" id={tabPanelId} aria-labelledby={activeTabId} className="mt-4">
        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <DefinitionRow label="JMBG" value={maskJmbg(employee.jmbg)} />
              <DefinitionRow label="Phone" value={employee.phone ?? '-'} />
              <DefinitionRow label="Address" value={employee.address ?? '-'} />
              <DefinitionRow label="Position" value={employee.positionName ?? '-'} />
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-200">Currently Assigned Assets</p>
                {assignedItems.length ? (
                  <Button variant="secondary" onClick={() => onTabChange('assigned-assets')}>
                    View All
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                {!assignedPreview.length ? (
                  <div className="rounded-sm border border-white/15 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-slate-200">No active assets</p>
                    <p className="mt-1 text-sm text-slate-400">This employee currently has no active asset assignments.</p>
                  </div>
                ) : (
                  assignedPreview.map((assignment) => (
                    <div key={assignment.id} className="rounded-sm border border-white/15 bg-black/20 p-4">
                      <p className="text-sm font-semibold text-slate-100">{resolveAssetLabel(assignment)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Taken: {formatDateTime(assignment.takenAt)} | Due: {formatDateTime(assignment.dueAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => onOpenAsset(assignment.assetId)}>Open Asset</Button>
                        <Button variant="primary" onClick={() => onReturn(assignment.id)}>Return</Button>
                        {assignment.reversFileId !== null ? (
                          <Button variant="secondary" onClick={() => onDownloadRevers(assignment.reversFileId!)}>
                            Download Revers
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'assigned-assets' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={6} />
          ) : (
            <Card>
              <div className="space-y-3">
                {!assignedItems.length ? (
                  <p className="text-sm text-slate-400">No active assets.</p>
                ) : (
                  assignedItems.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/15 bg-black/20 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100">{resolveAssetLabel(assignment)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Taken: {formatDateTime(assignment.takenAt)} | Due: {formatDateTime(assignment.dueAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => onOpenAsset(assignment.assetId)}>Open</Button>
                        {assignment.reversFileId !== null ? (
                          <Button variant="secondary" onClick={() => onDownloadRevers(assignment.reversFileId!)}>
                            Download Revers
                          </Button>
                        ) : null}
                        <Button variant="primary" onClick={() => onReturn(assignment.id)}>Return</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        ) : null}

        {activeTab === 'history' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={6} />
          ) : (
            <Card>
              <div className="space-y-3">
                {!historyItems.length ? (
                  <p className="text-sm text-slate-400">No assignment history.</p>
                ) : (
                  historyItems.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/15 bg-black/20 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100">{resolveAssetLabel(assignment)}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Taken: {formatDateTime(assignment.takenAt)} | Returned: {formatDateTime(assignment.returnedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => onOpenAssignment(assignment.id)}>Open Assignment</Button>
                        {assignment.reversFileId !== null ? (
                          <Button variant="secondary" onClick={() => onDownloadRevers(assignment.reversFileId!)}>
                            Download Revers
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        ) : null}

        {activeTab === 'documents' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={4} />
          ) : (
            <Card>
              <div className="space-y-3">
                {!reversDocs.length ? (
                  <p className="text-sm text-slate-400">No revers documents.</p>
                ) : (
                  reversDocs.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 rounded-sm border border-white/15 bg-black/20 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100">Revers</p>
                        <p className="mt-1 text-xs text-slate-400">Date: {formatDate(assignment.takenAt)}</p>
                      </div>
                      {assignment.reversFileId !== null ? (
                        <Button variant="secondary" onClick={() => onDownloadRevers(assignment.reversFileId!)}>
                          Download
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )
        ) : null}
      </div>

      <Dialog open={moreOpen} title="More actions" onClose={() => setMoreOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-sm border border-white/15 bg-black/20 p-4">
            <p className="text-sm font-semibold text-slate-200">Deactivate employee</p>
            <p className="mt-1 text-sm text-slate-400">
              {hasActiveAssets
                ? 'Disabled: return all assigned assets first.'
                : 'Mark this employee as inactive.'}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMoreOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={hasActiveAssets}
                onClick={() => {
                  if (hasActiveAssets) return
                  setMoreOpen(false)
                  onDeactivate()
                }}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
