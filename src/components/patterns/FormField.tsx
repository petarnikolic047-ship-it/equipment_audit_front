import type { PropsWithChildren } from 'react'

interface FormFieldProps {
  label: string
  error?: string
}

export function FormField({ label, error, children }: PropsWithChildren<FormFieldProps>) {
  return (
    <label className="block space-y-1.5">
      <span className="brand-display text-[11px] font-semibold tracking-[0.12em] text-slate-300">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  )
}
