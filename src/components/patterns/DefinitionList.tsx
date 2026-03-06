import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface DefinitionListItem {
  id?: string | number
  label: ReactNode
  value: ReactNode
}

interface DefinitionListProps {
  items: DefinitionListItem[]
  className?: string
  rowClassName?: string
  labelClassName?: string
  valueClassName?: string
}

export function DefinitionList({
  items,
  className,
  rowClassName,
  labelClassName,
  valueClassName,
}: DefinitionListProps) {
  return (
    <dl className={cn('rounded-sm border-y border-white/20', className)}>
      {items.map((item, index) => (
        <div
          key={item.id ?? `${String(item.label)}-${index}`}
          className={cn(
            'grid grid-cols-1 gap-2 border-b border-white/20 px-0 py-4 last:border-b-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start sm:gap-8',
            rowClassName,
          )}
        >
          <dt className={cn('text-[14px] font-medium leading-6 text-slate-300', labelClassName)}>{item.label}</dt>
          <dd className={cn('break-words text-base font-semibold leading-6 text-slate-100', valueClassName)}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
