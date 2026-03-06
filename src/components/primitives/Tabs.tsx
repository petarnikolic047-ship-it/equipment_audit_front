import { cn } from '../../utils/cn'

export interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ items, activeId, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-white/15 pb-2">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'brand-display rounded-sm border px-3 py-1.5 text-[12px] tracking-[0.08em] transition',
            activeId === item.id
              ? 'border-signal-500 bg-signal-500/20 text-signal-100'
              : 'border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/5',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
