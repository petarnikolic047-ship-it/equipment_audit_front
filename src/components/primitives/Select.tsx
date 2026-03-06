import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-sm border border-white/25 bg-black/45 px-3 text-sm text-slate-100 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
