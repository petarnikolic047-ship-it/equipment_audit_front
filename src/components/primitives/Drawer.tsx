import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  side?: 'right' | 'left'
  className?: string
}

export function Drawer({ open, title, onClose, side = 'right', className, children }: PropsWithChildren<DrawerProps>) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/70">
      <div
        className={cn(
          'absolute top-0 h-full w-full max-w-xl border-white/20 bg-card p-5',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="brand-display text-2xl leading-none text-slate-100">{title}</h3>
          <Button variant="icon" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </Button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  )
}
