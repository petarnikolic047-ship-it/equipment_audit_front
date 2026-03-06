import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState, type RefObject } from 'react'
import { Button } from '../../../components/primitives/Button'
import { Card } from '../../../components/primitives/Card'
import { Dialog } from '../../../components/primitives/Dialog'
import { InlineDetailTabs, type InlineDetailTabItem } from '../../../components/primitives/InlineDetailTabs'
import { Select } from '../../../components/primitives/Select'
import { Input } from '../../../components/primitives/Input'
import { StatusBadge } from '../../../components/primitives/StatusBadge'
import { JsonDiffViewer } from '../../../components/patterns/JsonDiffViewer'
import { FormField } from '../../../components/patterns/FormField'
import { DetailPanelSkeleton } from '../../../components/patterns/DetailPanelSkeleton'
import { DefinitionGrid } from '../../../components/patterns/workspace/DefinitionGrid'
import { ExpandedWorkspaceHeader } from '../../../components/patterns/workspace/ExpandedWorkspaceHeader'
import { OpsSummaryCards } from '../../../components/patterns/workspace/OpsSummaryCards'
import { RelatedItemsList } from '../../../components/patterns/workspace/RelatedItemsList'
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format'
import type { Asset, AssetStatus } from '../../../types/asset'
import type { Assignment } from '../../../types/assignment'
import type { AssetAttributeValue, AttributeDefinition, EnumOption } from '../../../types/attributes'
import type { AssetDocument, AssetEvent, ConditionInspection, MaintenanceTicket } from '../../../types/assetOps'
import type { EntityHistoryRecord } from '../../../types/history'
import type { AssetAuditTrail } from '../../../api/services/assetOpsService'
import { cn } from '../../../utils/cn'
import { useStagedMount } from '../../../utils/useStagedMount'

interface AssetDetailWorkspaceProps {
  asset: Asset
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
  statusMismatch: boolean
  effectiveStatus: AssetStatus
  canAssign: boolean
  canReturn: boolean
  canTransfer: boolean
  canOpenMaintenance: boolean
  onAssign: () => void
  onReturn: () => void
  onTransfer: () => void
  onOpenMaintenance: () => void
  onDeactivate: () => void
  currentAssignment: Assignment | null
  onOpenAssignment: (assignmentId: number) => void
  onDownloadRevers: (fileId: number) => void
  attributes: AssetAttributeValue[]
  defsById: Map<number, AttributeDefinition>
  enumById: Map<number, EnumOption>
  usersById: Map<number, string>
  resolveAttributeValue: (value: AssetAttributeValue, enums: Map<number, EnumOption>, users: Map<number, string>) => string
  timelineRows: AssetEvent[]
  timelineTypeFilter: string
  timelineFromDate: string
  timelineToDate: string
  onTimelineTypeFilterChange: (value: string) => void
  onTimelineFromDateChange: (value: string) => void
  onTimelineToDateChange: (value: string) => void
  assignmentHistory: Assignment[]
  inspections: ConditionInspection[]
  maintenanceTickets: MaintenanceTicket[]
  documents: AssetDocument[]
  auditTrail?: AssetAuditTrail
  selectedHistoryItem: EntityHistoryRecord | null
  onSelectHistoryItem: (id: number) => void
  onRecordInspection: () => void
  onOpenMaintenanceTicket: () => void
  onCompleteMaintenanceTicket: (ticket: MaintenanceTicket) => void
  onDownloadMaintenanceReport: (fileId: number) => void
  onDownloadDocument: (fileId: number) => void
}

const heavyTabs = new Set(['timeline', 'maintenance', 'documents', 'audit'])

export function AssetDetailWorkspace({
  asset,
  activeTab,
  onTabChange,
  tabIdBase,
  tabs,
  isFullMode,
  isOpen = true,
  headerFocusRef,
  onClose,
  onBackToList,
  statusMismatch,
  effectiveStatus,
  canAssign,
  canReturn,
  canTransfer,
  canOpenMaintenance,
  onAssign,
  onReturn,
  onTransfer,
  onOpenMaintenance,
  onDeactivate,
  currentAssignment,
  onOpenAssignment,
  onDownloadRevers,
  attributes,
  defsById,
  enumById,
  usersById,
  resolveAttributeValue,
  timelineRows,
  timelineTypeFilter,
  timelineFromDate,
  timelineToDate,
  onTimelineTypeFilterChange,
  onTimelineFromDateChange,
  onTimelineToDateChange,
  assignmentHistory,
  inspections,
  maintenanceTickets,
  documents,
  auditTrail,
  selectedHistoryItem,
  onSelectHistoryItem,
  onRecordInspection,
  onOpenMaintenanceTicket,
  onCompleteMaintenanceTicket,
  onDownloadMaintenanceReport,
  onDownloadDocument,
}: AssetDetailWorkspaceProps) {
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const shouldStageHeavyPanel = isOpen && heavyTabs.has(activeTab)
  const heavyPanelReady = useStagedMount(shouldStageHeavyPanel, 140)
  const showHeavyPanelSkeleton = shouldStageHeavyPanel && !heavyPanelReady

  const tabPanelId = `${tabIdBase}-panel-${activeTab}`
  const activeTabId = `${tabIdBase}-tab-${activeTab}`
  const relatedAssignmentsPreview = useMemo(
    () => assignmentHistory.filter((row) => row.id !== currentAssignment?.id).slice(0, 3),
    [assignmentHistory, currentAssignment?.id],
  )

  return (
    <div className="relative rounded-sm border border-white/15 bg-black/35 p-3">
      <ExpandedWorkspaceHeader
        title={asset.name}
        idChip={asset.inventoryNumber}
        subtitle={`Category: ${asset.categoryName} | Location: ${asset.locationName ?? 'Unassigned'}`}
        headerFocusRef={headerFocusRef}
        primaryActions={
          <>
            <StatusBadge status={effectiveStatus} />
            {canReturn ? <Button variant="primary" onClick={onReturn}>Return</Button> : null}
            {canTransfer ? <Button variant="secondary" onClick={onTransfer}>Transfer</Button> : null}
            {!canReturn && canAssign ? <Button variant="primary" onClick={onAssign}>Assign</Button> : null}
            {canOpenMaintenance ? <Button variant="secondary" onClick={onOpenMaintenance}>Under Service</Button> : null}
          </>
        }
        secondaryActions={
          <>
            <Button variant="ghost" onClick={() => setMoreOpen(true)}>More</Button>
            {isFullMode && onBackToList ? <Button variant="ghost" onClick={onBackToList}>Back To List</Button> : null}
            {!isFullMode && onClose ? <Button variant="ghost" onClick={onClose}>Close</Button> : null}
          </>
        }
      />

      <div className="mt-3 rounded-sm border border-white/15 bg-black/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-slate-300">Asset Context</span>
            <span className="mx-2 text-slate-500">|</span>
            Effective status: <span className="font-semibold">{effectiveStatus.replaceAll('_', ' ')}</span>
            <span className="mx-2 text-slate-500">|</span>
            Current custodian: <span className="font-semibold">{currentAssignment?.employeeFullName ?? 'Unassigned'}</span>
            <span className="mx-2 text-slate-500">|</span>
            Taken: <span className="font-semibold">{formatDateTime(currentAssignment?.takenAt)}</span>
            <span className="mx-2 text-slate-500">|</span>
            Due: <span className="font-semibold">{formatDateTime(currentAssignment?.dueAt)}</span>
            <span className="mx-2 text-slate-500">|</span>
            Last audit seen: <span className="font-semibold">{formatDateTime(asset.lastSeenAuditAt)}</span>
            <span className="mx-2 text-slate-500">|</span>
            Missing in audit: <span className="font-semibold">{asset.isMissing ? 'Yes' : 'No'}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {currentAssignment ? (
              <Button variant="secondary" onClick={() => onOpenAssignment(currentAssignment.id)}>
                Open Assignment
              </Button>
            ) : null}
            {currentAssignment?.reversFileId ? (
              <Button variant="secondary" onClick={() => onDownloadRevers(currentAssignment.reversFileId!)}>
                Download Revers
              </Button>
            ) : null}
            {currentAssignment ? (
              <Button variant="ghost" onClick={() => setShowAssignmentDetails((value) => !value)}>
                {showAssignmentDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAssignmentDetails ? 'Hide Details' : 'Expand Details'}
              </Button>
            ) : null}
          </div>
        </div>

        {statusMismatch ? (
          <p className="mt-2 text-xs font-medium text-amber-200">
            Status mismatch detected: open assignment is present, so status is shown as ASSIGNED.
          </p>
        ) : null}

        {showAssignmentDetails && currentAssignment ? (
          <div className="mt-3">
            <DefinitionGrid
              items={[
                { id: 'ctx-employee', label: 'Employee', value: currentAssignment.employeeFullName },
                { id: 'ctx-taken-at', label: 'Taken At', value: formatDateTime(currentAssignment.takenAt) },
                { id: 'ctx-due-at', label: 'Due At', value: formatDateTime(currentAssignment.dueAt) },
                { id: 'ctx-returned-at', label: 'Returned At', value: formatDateTime(currentAssignment.returnedAt) },
              ]}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <InlineDetailTabs idBase={tabIdBase} items={tabs} activeId={activeTab} onChange={onTabChange} />
      </div>

      <div role="tabpanel" id={tabPanelId} aria-labelledby={activeTabId} className="mt-3 space-y-3">
        {activeTab === 'overview' ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <DefinitionGrid
                items={[
                  { id: 'serial', label: 'Serial', value: asset.serialNumber ?? '-' },
                  { id: 'purchase-date', label: 'Purchase Date', value: formatDate(asset.purchaseDate) },
                  { id: 'activation-date', label: 'Activation Date', value: formatDate(asset.activationDate) },
                  { id: 'purchase-value', label: 'Purchase Value', value: formatCurrency(asset.purchaseValue) },
                  { id: 'location', label: 'Location', value: asset.locationName ?? '-' },
                  { id: 'comment', label: 'Comment', value: asset.comment ?? '-' },
                ]}
              />

              <Card title="Dynamic Attributes">
                {attributes.length ? (
                  <DefinitionGrid
                    className="border-x-0 border-y-0"
                    items={attributes.map((item) => ({
                      id: item.id,
                      label: defsById.get(item.attributeId)?.label ?? `Attribute #${item.attributeId}`,
                      value: resolveAttributeValue(item, enumById, usersById),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-slate-400">No attributes.</p>
                )}
              </Card>
            </div>

            <div className="space-y-3">
              <OpsSummaryCards
                items={[
                  { id: 'under-service', label: 'Under Service', value: asset.status === 'UNDER_SERVICE' ? 'Yes' : 'No' },
                  { id: 'missing-audit', label: 'Missing In Audit', value: asset.isMissing ? 'Yes' : 'No', tone: asset.isMissing ? 'warning' : 'default' },
                  { id: 'history-count', label: 'Assignment History', value: assignmentHistory.length },
                  { id: 'docs-count', label: 'Documents', value: documents.length },
                ]}
              />

              <RelatedItemsList
                title="Related Assignments"
                items={relatedAssignmentsPreview.map((row) => ({
                  id: row.id,
                  title: `${row.assetInventoryNumber} - ${row.employeeFullName}`,
                  meta: (
                    <>
                      Taken: {formatDateTime(row.takenAt)} | Returned: {formatDateTime(row.returnedAt)}
                    </>
                  ),
                  actions: [
                    { id: 'open-assignment', label: 'Open Assignment', onClick: () => onOpenAssignment(row.id), variant: 'secondary' as const },
                    {
                      id: 'download-revers',
                      label: 'Download Revers',
                      onClick: () => row.reversFileId && onDownloadRevers(row.reversFileId),
                      variant: 'secondary' as const,
                      disabled: !row.reversFileId,
                    },
                  ],
                }))}
                onViewAll={() => onTabChange('assignments')}
                emptyTitle="No related assignments"
                emptyDescription="No additional assignment history is available for this asset."
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'timeline' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={8} />
          ) : (
            <Card title="Timeline">
              <div className="mb-3 grid gap-2 md:grid-cols-3">
                <FormField label="Event Type">
                  <Select value={timelineTypeFilter} onChange={(event) => onTimelineTypeFilterChange(event.target.value)}>
                    <option value="">All events</option>
                    <option value="ASSET_CREATED">ASSET_CREATED</option>
                    <option value="ASSET_UPDATED">ASSET_UPDATED</option>
                    <option value="ASSIGNMENT_CREATED">ASSIGNMENT_CREATED</option>
                    <option value="ASSIGNMENT_RETURNED">ASSIGNMENT_RETURNED</option>
                    <option value="MAINTENANCE_OPENED">MAINTENANCE_OPENED</option>
                    <option value="MAINTENANCE_COMPLETED">MAINTENANCE_COMPLETED</option>
                    <option value="CUSTODY_TRANSFERRED">CUSTODY_TRANSFERRED</option>
                    <option value="STOCKTAKE_FINALIZED">STOCKTAKE_FINALIZED</option>
                  </Select>
                </FormField>
                <FormField label="From">
                  <Input type="date" value={timelineFromDate} onChange={(event) => onTimelineFromDateChange(event.target.value)} />
                </FormField>
                <FormField label="To">
                  <Input type="date" value={timelineToDate} onChange={(event) => onTimelineToDateChange(event.target.value)} />
                </FormField>
              </div>
              <div className="space-y-2">
                {timelineRows.map((row) => (
                  <div key={row.id} className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-100">{row.eventType}</p>
                    <p className="text-slate-300">Occurred: {formatDateTime(row.occurredAt)} | Recorded: {formatDateTime(row.recordedAt)}</p>
                    <p className="text-slate-400">Source: {row.source} | Actor: {row.actor}</p>
                    {row.note ? <p className="text-slate-300">{row.note}</p> : null}
                  </div>
                ))}
                {!timelineRows.length ? <p className="text-sm text-slate-400">No timeline events for selected filters.</p> : null}
              </div>
            </Card>
          )
        ) : null}

        {activeTab === 'assignments' ? (
          <Card title="Assignments">
            {assignmentHistory.length ? (
              <div className="overflow-auto rounded-sm border border-white/15">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-black/70 text-left">
                    <tr>
                      <th className="px-3 py-2 text-xs text-slate-300">Custodian</th>
                      <th className="px-3 py-2 text-xs text-slate-300">Taken</th>
                      <th className="px-3 py-2 text-xs text-slate-300">Returned</th>
                      <th className="px-3 py-2 text-xs text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentHistory.map((row) => (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-3 py-2 text-slate-200">{row.employeeFullName}</td>
                        <td className="px-3 py-2 text-slate-300">{formatDateTime(row.takenAt)}</td>
                        <td className="px-3 py-2 text-slate-300">{formatDateTime(row.returnedAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => onOpenAssignment(row.id)}>Open</Button>
                            <Button variant="secondary" disabled={!row.reversFileId} onClick={() => row.reversFileId && onDownloadRevers(row.reversFileId)}>
                              Download Revers
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No assignment history.</p>
            )}
          </Card>
        ) : null}

        {activeTab === 'inspections' ? (
          <Card title="Condition & Inspections">
            <Button variant="primary" onClick={onRecordInspection}>Record Inspection</Button>
            <div className="mt-2 space-y-2">
              {inspections.map((row) => (
                <div key={row.id} className="rounded-sm border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-300">
                  <p className="font-medium text-slate-100">{row.conditionGrade}</p>
                  <p>{formatDateTime(row.occurredAt)}</p>
                  <p>{row.findings ?? '-'}</p>
                </div>
              ))}
              {!inspections.length ? <p className="text-sm text-slate-400">No inspections recorded.</p> : null}
            </div>
          </Card>
        ) : null}

        {activeTab === 'maintenance' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={7} />
          ) : (
            <Card title="Maintenance">
              <Button variant="primary" onClick={onOpenMaintenanceTicket}>Open Ticket</Button>
              <div className="mt-2 space-y-2">
                {maintenanceTickets.map((row) => (
                  <div key={row.id} className="rounded-xl border border-white/15 bg-black/30 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-slate-300">
                        <p className="font-medium text-slate-100">{row.title}</p>
                        <p>Status: {row.status}</p>
                        <p>Opened: {formatDateTime(row.openedAt)}</p>
                        <p>Expected return: {formatDateTime(row.expectedReturnAt)}</p>
                        {row.status === 'CLOSED' ? (
                          <>
                            <p>Closed: {formatDateTime(row.closedAt)}</p>
                            <p>Cost: {formatCurrency(row.cost)}</p>
                            <p>Downtime: {row.downtimeHours ?? '-'} hours</p>
                          </>
                        ) : null}
                        {row.notes ? <p>Notes: {row.notes}</p> : null}
                      </div>
                      {row.status === 'OPEN' ? (
                        <Button variant="secondary" onClick={() => onCompleteMaintenanceTicket(row)}>Complete</Button>
                      ) : row.reportFileId ? (
                        <Button variant="secondary" onClick={() => onDownloadMaintenanceReport(row.reportFileId as number)}>Report</Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!maintenanceTickets.length ? <p className="text-sm text-slate-400">No maintenance tickets recorded.</p> : null}
              </div>
            </Card>
          )
        ) : null}

        {activeTab === 'documents' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={5} />
          ) : (
            <Card title="Documents">
              {documents.length ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-sm border border-white/10 bg-black/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm border border-white/20 px-2 py-0.5 text-[10px] tracking-[0.08em] text-slate-300">{doc.docType}</span>
                        <span className="text-sm text-slate-300">{formatDateTime(doc.createdAt)}</span>
                      </div>
                      <Button variant="secondary" onClick={() => onDownloadDocument(doc.fileId)}>Download</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No documents recorded.</p>
              )}
            </Card>
          )
        ) : null}

        {activeTab === 'audit' ? (
          showHeavyPanelSkeleton ? (
            <DetailPanelSkeleton lines={9} />
          ) : (
            <Card title="Audit Trail">
              <div className="space-y-3">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Semantic Events</h3>
                  <div className="space-y-2">
                    {(auditTrail?.auditEvents ?? []).map((event) => (
                      <div key={event.id} className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm">
                        <p className="font-medium text-slate-100">{event.eventType}</p>
                        <p className="text-slate-300">Actor: {event.actor} | At: {formatDateTime(event.at)}</p>
                      </div>
                    ))}
                    {!auditTrail?.auditEvents.length ? <p className="text-sm text-slate-400">No semantic audit events.</p> : null}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Snapshot History</h3>
                  <div className="space-y-2">
                    {(auditTrail?.history ?? []).map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => onSelectHistoryItem(row.id)}
                        className={cn(
                          'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                          selectedHistoryItem?.id === row.id
                            ? 'border-signal-500 bg-signal-500/10'
                            : 'border-white/15 bg-black/30 hover:border-slate-500',
                        )}
                      >
                        <p className="font-medium text-slate-100">{row.operation}</p>
                        <p className="text-slate-300">{formatDateTime(row.changedAt)}</p>
                      </button>
                    ))}
                    {!auditTrail?.history.length ? <p className="text-sm text-slate-400">No entity snapshots for this asset.</p> : null}
                  </div>
                </div>
                {selectedHistoryItem ? <JsonDiffViewer oldJson={selectedHistoryItem.oldRowJson} newJson={selectedHistoryItem.newRowJson} /> : null}
              </div>
            </Card>
          )
        ) : null}
      </div>

      <Dialog open={moreOpen} title="More actions" onClose={() => setMoreOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-sm border border-white/15 bg-black/20 p-4">
            <p className="text-sm font-semibold text-slate-200">Deactivate asset</p>
            <p className="mt-1 text-sm text-slate-400">
              Deactivate removes this asset from active lifecycle operations while preserving audit history.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMoreOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  setMoreOpen(false)
                  onDeactivate()
                }}
              >
                Deactivate Asset
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
