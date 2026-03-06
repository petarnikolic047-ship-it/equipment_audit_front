import { cn } from '../../utils/cn'

export interface InlineDetailTabItem {
  id: string
  label: string
  badgeCount?: number
}

interface InlineDetailTabsProps {
  idBase: string
  items: InlineDetailTabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function InlineDetailTabs({ idBase, items, activeId, onChange, className }: InlineDetailTabsProps) {
  return (
    <div role="tablist" aria-label="Detail sections" className={cn('flex flex-wrap gap-2 border-b border-white/15 pb-2', className)}>
      {items.map((item) => {
        const tabId = `${idBase}-tab-${item.id}`
        const panelId = `${idBase}-panel-${item.id}`

        return (
          <button
            type="button"
            key={item.id}
            role="tab"
            id={tabId}
            aria-controls={panelId}
            aria-selected={activeId === item.id}
            tabIndex={activeId === item.id ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'brand-display rounded-sm border px-2.5 py-1 text-[11px] tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/70',
              activeId === item.id
                ? 'border-signal-500 bg-signal-500/20 text-signal-100'
                : 'border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/5',
            )}
          >
            <span>{item.label}</span>
            {item.badgeCount !== undefined ? (
              <span
                className={cn(
                  'ml-2 inline-flex min-w-5 items-center justify-center rounded-sm px-1 text-[10px] leading-4',
                  activeId === item.id ? 'bg-signal-500/30 text-signal-100' : 'bg-white/10 text-slate-300',
                )}
              >
                {item.badgeCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
