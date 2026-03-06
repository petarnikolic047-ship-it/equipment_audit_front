import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../primitives/Button'
import { Card } from '../primitives/Card'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { InlineRowExpander } from './InlineRowExpander'
import { cn } from '../../utils/cn'

export interface DataTableColumn<T> {
  key: string
  label: string
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  title?: string
  actions?: ReactNode
  columns: DataTableColumn<T>[]
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  rowKey?: (row: T, index: number) => string | number
  onRowClick?: (row: T, context?: { source: 'pointer' | 'keyboard'; rowKey: string }) => void
  isRowActive?: (row: T) => boolean
  isRowExpanded?: (row: T) => boolean
  renderExpandedContent?: (row: T) => ReactNode
  expandedRowClassName?: string
  tableBodyClassName?: string
  tableClassName?: string
}

export function DataTable<T>({
  title,
  actions,
  columns,
  rows,
  loading,
  emptyMessage = 'No data found',
  page,
  pageSize,
  total,
  onPageChange,
  rowKey,
  onRowClick,
  isRowActive,
  isRowExpanded,
  renderExpandedContent,
  expandedRowClassName,
  tableBodyClassName,
  tableClassName,
}: DataTableProps<T>) {
  const collapseAnimationMs = 220
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = total === 0 ? 0 : Math.min(page * pageSize, total)
  const [closingRowKeys, setClosingRowKeys] = useState<string[]>([])
  const previousExpandedRowKeyRef = useRef<string | null>(null)
  const closeTimersRef = useRef<Map<string, number>>(new Map())

  const resolvedRowKeys = useMemo(() => rows.map((row, index) => String(rowKey ? rowKey(row, index) : index)), [rowKey, rows])

  const expandedRowKey = useMemo(() => {
    if (!isRowExpanded) return null
    for (let index = 0; index < rows.length; index += 1) {
      if (isRowExpanded(rows[index])) return resolvedRowKeys[index]
    }
    return null
  }, [isRowExpanded, resolvedRowKeys, rows])

  const scheduleClosingRow = (rowKeyToClose: string) => {
    setClosingRowKeys((current) => (current.includes(rowKeyToClose) ? current : [...current, rowKeyToClose]))
    const existingTimer = closeTimersRef.current.get(rowKeyToClose)
    if (existingTimer) window.clearTimeout(existingTimer)
    const timerId = window.setTimeout(() => {
      setClosingRowKeys((current) => {
        const next = current.filter((key) => key !== rowKeyToClose)
        return next.length === current.length ? current : next
      })
      closeTimersRef.current.delete(rowKeyToClose)
    }, collapseAnimationMs)
    closeTimersRef.current.set(rowKeyToClose, timerId)
  }

  useEffect(() => {
    const previousExpandedKey = previousExpandedRowKeyRef.current
    if (previousExpandedKey && previousExpandedKey !== expandedRowKey) {
      scheduleClosingRow(previousExpandedKey)
    }

    if (expandedRowKey) {
      setClosingRowKeys((current) => {
        const next = current.filter((key) => key !== expandedRowKey)
        return next.length === current.length ? current : next
      })
      const existingTimer = closeTimersRef.current.get(expandedRowKey)
      if (existingTimer) {
        window.clearTimeout(existingTimer)
        closeTimersRef.current.delete(expandedRowKey)
      }
    }

    previousExpandedRowKeyRef.current = expandedRowKey
  }, [expandedRowKey])

  useEffect(
    () => () => {
      for (const timerId of closeTimersRef.current.values()) {
        window.clearTimeout(timerId)
      }
      closeTimersRef.current.clear()
    },
    [],
  )

  return (
    <Card>
      {title || actions ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="brand-display text-3xl leading-none text-card-foreground">{title}</h2> : <div />}
          {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-sm border border-white/20 bg-card">
        <div className={cn('max-h-[480px] overflow-auto', tableBodyClassName)}>
          <table className={cn('min-w-full border-collapse text-sm', tableClassName)}>
            <thead className="sticky top-0 z-10 bg-black text-left">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`brand-display px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-slate-200 ${column.className ?? ''}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8" colSpan={columns.length}>
                    <LoadingState text="Loading table data..." />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8" colSpan={columns.length}>
                    <EmptyState title="No records" description={emptyMessage} />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const resolvedRowKeyString = resolvedRowKeys[index]
                  const expanded = isRowExpanded?.(row) ?? false
                  const closing = closingRowKeys.includes(resolvedRowKeyString)
                  const shouldRenderExpandedRow = Boolean(renderExpandedContent && (expanded || closing))
                  const showExpandIndicator = Boolean(onRowClick && renderExpandedContent)
                  const expandedContent = shouldRenderExpandedRow && renderExpandedContent ? renderExpandedContent(row) : null

                  return (
                    <Fragment key={resolvedRowKeyString}>
                      <tr
                        data-row-key={resolvedRowKeyString}
                        tabIndex={onRowClick ? 0 : undefined}
                        className={cn(
                          'border-t border-white/10 transition-colors duration-200 motion-reduce:transition-none',
                          index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent',
                          onRowClick ? 'cursor-pointer hover:bg-signal-500/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70' : '',
                          expanded ? 'bg-signal-500/12 shadow-[inset_4px_0_0_0_rgba(49,115,179,0.95)]' : '',
                          isRowActive?.(row) ? 'bg-signal-500/18' : '',
                        )}
                        onClick={
                          onRowClick
                            ? () => onRowClick(row, { source: 'pointer', rowKey: resolvedRowKeyString })
                            : undefined
                        }
                        onKeyDown={
                          onRowClick
                            ? (event) => {
                                if (event.target !== event.currentTarget) return
                                if (event.key !== 'Enter' && event.key !== ' ') return
                                event.preventDefault()
                                onRowClick(row, { source: 'keyboard', rowKey: resolvedRowKeyString })
                              }
                            : undefined
                        }
                      >
                        {columns.map((column, columnIndex) => (
                          <td key={column.key} className={`px-4 py-3 align-top text-slate-200 ${column.className ?? ''}`}>
                            {columnIndex === 0 && showExpandIndicator ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">{column.render(row)}</div>
                                {expanded ? <ChevronUp size={14} className="shrink-0 text-slate-300" /> : <ChevronDown size={14} className="shrink-0 text-slate-400" />}
                              </div>
                            ) : (
                              column.render(row)
                            )}
                          </td>
                        ))}
                      </tr>
                      {shouldRenderExpandedRow && expandedContent ? (
                        <tr className={cn('border-t border-white/10 bg-black/35', expandedRowClassName)}>
                          <td className="px-0 py-0" colSpan={columns.length}>
                            <InlineRowExpander open={expanded}>{expandedContent}</InlineRowExpander>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/15 bg-black/65 px-3 py-2">
          <p className="text-xs text-slate-400">
            Showing {start} to {end} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <span className="min-w-8 text-center text-sm font-medium text-slate-200">{page}</span>
            <Button variant="icon" disabled={page >= maxPage} onClick={() => onPageChange(page + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
