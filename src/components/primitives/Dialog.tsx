import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  className?: string
}

export function Dialog({ open, title, description, onClose, className, children }: PropsWithChildren<DialogProps>) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
      <div className={cn('w-full max-w-2xl rounded-sm border border-white/20 bg-card p-5', className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="brand-display text-2xl leading-none text-slate-100">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
          </div>
          <Button variant="icon" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
