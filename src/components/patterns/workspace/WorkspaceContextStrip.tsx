import type { ReactNode } from 'react'
import { cn } from '../../../utils/cn'

export interface WorkspaceContextFact {
  id?: string | number
  label?: ReactNode
  value: ReactNode
}

interface WorkspaceContextStripProps {
  leading?: ReactNode
  facts?: WorkspaceContextFact[]
  actions?: ReactNode
  className?: string
}

export function WorkspaceContextStrip({ leading, facts = [], actions, className }: WorkspaceContextStripProps) {
  return (
    <div className={cn('rounded-sm border border-white/15 bg-black/40 px-3 py-2', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-300">
        {leading ? <span className="font-semibold text-slate-100">{leading}</span> : null}
        {facts.map((fact, index) => (
          <span key={fact.id ?? index} className="inline-flex items-center gap-1">
            {fact.label ? <span className="text-slate-400">{fact.label}:</span> : null}
            <span>{fact.value}</span>
          </span>
        ))}
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
