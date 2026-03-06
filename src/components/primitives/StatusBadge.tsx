import { cn } from '../../utils/cn'

const badgeMap: Record<string, string> = {
  ASSIGNED: 'bg-signal-500/20 text-signal-100 ring-1 ring-signal-500/45',
  IN_STOCK: 'bg-brand-500/20 text-brand-100 ring-1 ring-brand-500/45',
  UNDER_SERVICE: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
  DISABLED: 'bg-slate-700/70 text-slate-100 ring-1 ring-slate-500/50',
  FAILED: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40',
  COMPLETED: 'bg-brand-500/20 text-brand-100 ring-1 ring-brand-500/45',
  RUNNING: 'bg-signal-500/20 text-signal-100 ring-1 ring-signal-500/45',
  QUEUED: 'bg-slate-700/70 text-slate-100 ring-1 ring-slate-500/50',
  READY_TO_APPLY: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/35',
  APPLYING: 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/35',
  COMPLETED_WITH_ERRORS: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
  ACTIVE: 'bg-brand-500/20 text-brand-100 ring-1 ring-brand-500/45',
  OPTIONAL: 'bg-slate-700/70 text-slate-100 ring-1 ring-slate-500/50',
  REQUIRED: 'bg-brand-500/20 text-brand-100 ring-1 ring-brand-500/45',
  WARN: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/35',
  INFO: 'bg-slate-700/70 text-slate-100 ring-1 ring-slate-500/50',
  ERROR: 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/35',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('brand-display inline-flex rounded-sm px-2.5 py-1 text-[11px] font-bold tracking-[0.08em]', badgeMap[status] ?? 'bg-slate-700/70 text-slate-100')}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}
