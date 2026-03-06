import type { ReactNode, RefObject } from 'react'
import { cn } from '../../../utils/cn'

interface ExpandedWorkspaceHeaderProps {
  title: ReactNode
  idChip?: ReactNode
  subtitle?: ReactNode
  primaryActions?: ReactNode
  secondaryActions?: ReactNode
  headerFocusRef?: RefObject<HTMLDivElement>
  className?: string
}

export function ExpandedWorkspaceHeader({
  title,
  idChip,
  subtitle,
  primaryActions,
  secondaryActions,
  headerFocusRef,
  className,
}: ExpandedWorkspaceHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div ref={headerFocusRef} tabIndex={-1} className="min-w-0">
          <h2 className="brand-display truncate text-3xl leading-none text-slate-100">
            {title}
            {idChip ? (
              <span className="ml-2 inline-flex rounded-sm border border-white/20 px-2 py-0.5 align-middle text-xs tracking-[0.08em] text-slate-300">
                {idChip}
              </span>
            ) : null}
          </h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {secondaryActions ? <div className="flex shrink-0 items-center gap-1">{secondaryActions}</div> : null}
      </div>
      {primaryActions ? <div className="flex flex-wrap items-center gap-2">{primaryActions}</div> : null}
    </div>
  )
}
