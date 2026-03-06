import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-brand-500 bg-brand-500 text-ink-900 hover:bg-brand-600 hover:border-brand-600',
  secondary: 'border border-white/25 bg-white/5 text-white hover:border-signal-500 hover:bg-signal-500/15',
  ghost: 'border border-transparent bg-transparent text-slate-200 hover:bg-white/10',
  danger: 'border border-[#ef493d] bg-[#ef493d] text-white hover:bg-[#dd4136] hover:border-[#dd4136]',
  icon: 'h-9 w-9 border border-white/25 bg-white/5 p-0 text-slate-100 hover:border-signal-500 hover:bg-signal-500/15',
}

export function Button({ children, className, variant = 'secondary', type = 'button', ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        'brand-display inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-[14px] font-bold tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
