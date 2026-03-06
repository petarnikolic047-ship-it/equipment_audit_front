import { type RefObject } from 'react'
import { Button } from '../../../components/primitives/Button'
import { InlineDetailTabs, type InlineDetailTabItem } from '../../../components/primitives/InlineDetailTabs'
import { DetailPanelSkeleton } from '../../../components/patterns/DetailPanelSkeleton'
import { DefinitionGrid } from '../../../components/patterns/workspace/DefinitionGrid'
import { ExpandedWorkspaceHeader } from '../../../components/patterns/workspace/ExpandedWorkspaceHeader'
import { OpsSummaryCards } from '../../../components/patterns/workspace/OpsSummaryCards'
import { RelatedItemsList } from '../../../components/patterns/workspace/RelatedItemsList'
import { formatDateTime } from '../../../utils/format'
import type { Assignment } from '../../../types/assignment'
import { useStagedMount } from '../../../utils/useStagedMount'

interface AssignmentDetailWorkspaceProps {
  assignment: Assignment
  activeTab: string
  onTabChange: (tabId: string) => void
  tabIdBase: string
  tabs: InlineDetailTabItem[]
  isDesktop: boolean
  isFullMode: boolean
  isOpen?: boolean
  assetStatus: string
  canRunLifecycle: boolean
  lastReversFileId: number | null
  headerFocusRef?: RefObject<HTMLDivElement>
  onClose?: () => void
  onBackToList?: () => void
  onReturn: (assignmentId: number) => void
  onDownloadRevers: (fileId: number) => void
  onOpenAsset: (assetId: number) => void
  onOpenEmployee: (employeeId: number) => void
}

export function AssignmentDetailWorkspace({
  assignment,
  activeTab,
  onTabChange,
  tabIdBase,
  tabs,
  isFullMode,
  isOpen = true,
  assetStatus,
  canRunLifecycle,
  lastReversFileId,
  headerFocusRef,
  onClose,
  onBackToList,
  onReturn,
  onDownloadRevers,
  onOpenAsset,
  onOpenEmployee,
}: AssignmentDetailWorkspaceProps) {
  const detailPanelReady = useStagedMount(isOpen, 120)

  const tabPanelId = `${tabIdBase}-panel-${activeTab}`
  const activeTabId = `${tabIdBase}-tab-${activeTab}`

  return (
    <div className="relative rounded-sm border border-white/15 bg-black/35 p-4">
      <div className="space-y-4">
        <ExpandedWorkspaceHeader
          title={assignment.assetInventoryNumber}
          idChip={`ASG-${assignment.id}`}
          subtitle={<>Asset: {assignment.assetName} | Employee: {assignment.employeeFullName}</>}
          headerFocusRef={headerFocusRef}
          primaryActions={
            <>
              <Button disabled={Boolean(assignment.returnedAt) || !canRunLifecycle} onClick={() => onReturn(assignment.id)}>
                Return
              </Button>
              <Button
                disabled={!assignment.reversFileId && !lastReversFileId}
                onClick={() => {
                  const fileId = assignment.reversFileId ?? lastReversFileId
                  if (!fileId) return
                  onDownloadRevers(fileId)
                }}
              >
                Download Revers
              </Button>
            </>
          }
          secondaryActions={
            <>
              <Button variant="ghost" onClick={() => onOpenAsset(assignment.assetId)}>Open Asset</Button>
              <Button variant="ghost" onClick={() => onOpenEmployee(assignment.employeeId)}>Open Employee</Button>
              {isFullMode && onBackToList ? <Button variant="ghost" onClick={onBackToList}>Back To List</Button> : null}
              {!isFullMode && onClose ? <Button variant="ghost" onClick={onClose}>Close</Button> : null}
            </>
          }
        />
        <InlineDetailTabs idBase={tabIdBase} items={tabs} activeId={activeTab} onChange={onTabChange} />
      </div>

      <div role="tabpanel" id={tabPanelId} aria-labelledby={activeTabId} className="mt-4">
        {detailPanelReady ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <DefinitionGrid
              items={[
                { id: 'taken-at', label: 'Taken At', value: formatDateTime(assignment.takenAt) },
                { id: 'due-at', label: 'Due At', value: formatDateTime(assignment.dueAt) },
                { id: 'returned-at', label: 'Returned At', value: formatDateTime(assignment.returnedAt) },
                { id: 'return-reason', label: 'Return Reason', value: assignment.returnReasonName ?? '-' },
                { id: 'employee-active', label: 'Employee Active', value: assignment.employeeActive ? 'Yes' : 'No' },
              ]}
            />
            <div className="space-y-3">
              <OpsSummaryCards
                items={[
                  { id: 'assignment-state', label: 'Assignment State', value: assignment.returnedAt ? 'Completed' : 'Active' },
                  { id: 'asset-status', label: 'Asset Status', value: assetStatus },
                  { id: 'has-revers', label: 'Revers Document', value: assignment.reversFileId || lastReversFileId ? 'Available' : 'Missing' },
                ]}
              />
              <RelatedItemsList
                title="Documents"
                items={
                  assignment.reversFileId || lastReversFileId
                    ? [
                        {
                          id: `revers-${assignment.id}`,
                          title: `Revers #${assignment.id}`,
                          meta: <>Generated from assignment lifecycle</>,
                          actions: [
                            {
                              id: 'download-revers',
                              label: 'Download Revers',
                              onClick: () => {
                                const fileId = assignment.reversFileId ?? lastReversFileId
                                if (!fileId) return
                                onDownloadRevers(fileId)
                              },
                              variant: 'secondary' as const,
                            },
                          ],
                        },
                      ]
                    : []
                }
                emptyTitle="No documents"
                emptyDescription="No revers document is available for this assignment yet."
              />
            </div>
          </div>
        ) : (
          <DetailPanelSkeleton lines={6} />
        )}
      </div>

    </div>
  )
}
