import type { PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  className?: string
  title?: string
}

export function Card({ className, title, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={cn('brand-outline rounded-sm bg-card/90 p-4 text-card-foreground', className)}>
      {title ? <h2 className="brand-display mb-3 text-3xl leading-none text-card-foreground">{title}</h2> : null}
      {children}
    </section>
  )
}
