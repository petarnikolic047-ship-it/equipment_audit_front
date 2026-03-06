import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn'

type SummaryTone = 'default' | 'warning' | 'success'

interface OpsSummaryCard {
  id?: string | number
  label: ReactNode
  value: ReactNode
  tone?: SummaryTone
}

interface OpsSummaryCardsProps {
  items: OpsSummaryCard[]
  className?: string
}

const valueToneClassName: Record<SummaryTone, string> = {
  default: 'text-slate-100',
  warning: 'text-amber-200',
  success: 'text-brand-300',
}

export function OpsSummaryCards({ items, className }: OpsSummaryCardsProps) {
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'default'
        return (
          <div key={item.id ?? index} className="rounded-sm border border-white/15 bg-black/35 px-3 py-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
            <p className={cn('mt-1 break-words text-2xl font-semibold leading-tight', valueToneClassName[tone])}>{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}
