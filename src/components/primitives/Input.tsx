import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-sm border border-white/25 bg-black/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-signal-500 focus:ring-2 focus:ring-signal-500/25',
        className,
      )}
      {...props}
    />
  )
})
