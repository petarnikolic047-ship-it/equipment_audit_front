import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-white/25 bg-black/45 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25',
        className,
      )}
      {...props}
    />
  )
})
