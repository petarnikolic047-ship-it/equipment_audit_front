import type { ReactNode } from 'react'
import { Button } from '../../primitives/Button'
import { cn } from '../../../utils/cn'

interface RelatedItemAction {
  id?: string | number
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
}

export interface RelatedItem {
  id: string | number
  title: ReactNode
  meta?: ReactNode
  actions?: RelatedItemAction[]
}

interface RelatedItemsListProps {
  title: string
  items: RelatedItem[]
  emptyTitle: string
  emptyDescription: string
  onViewAll?: () => void
  viewAllLabel?: string
  className?: string
}

export function RelatedItemsList({
  title,
  items,
  emptyTitle,
  emptyDescription,
  onViewAll,
  viewAllLabel = 'View All',
  className,
}: RelatedItemsListProps) {
  return (
    <div className={cn('rounded-sm border border-white/15 bg-black/35 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-200">{title}</p>
        {onViewAll ? (
          <Button variant="secondary" onClick={onViewAll}>
            {viewAllLabel}
          </Button>
        ) : null}
      </div>

      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-sm border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-sm font-semibold text-slate-100">{item.title}</p>
              {item.meta ? <div className="mt-1 text-xs text-slate-300">{item.meta}</div> : null}
              {item.actions?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.actions.map((action, index) => (
                    <Button
                      key={action.id ?? index}
                      variant={action.variant ?? 'secondary'}
                      disabled={action.disabled}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-semibold text-slate-100">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-400">{emptyDescription}</p>
        </div>
      )}
    </div>
  )
}
