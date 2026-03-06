interface PagePlaceholderProps {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p>
      <div className="mt-5 rounded-xl border border-dashed border-border bg-slate-900/50 p-4 text-sm text-slate-300">
        Step 1 scaffold placeholder. Feature implementation starts in next steps.
      </div>
    </section>
  )
}
