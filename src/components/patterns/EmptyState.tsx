interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-sm border border-dashed border-white/25 bg-black/35 p-5 text-center">
      <h3 className="brand-display text-xl leading-none text-slate-200">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  )
}
