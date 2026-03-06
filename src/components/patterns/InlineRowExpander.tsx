import { useEffect, useState, type PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'
import { useMediaQuery } from '../../utils/useMediaQuery'

interface InlineRowExpanderProps {
  open: boolean
  className?: string
}

export function InlineRowExpander({ open, className, children }: PropsWithChildren<InlineRowExpanderProps>) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [visualOpen, setVisualOpen] = useState(() => (prefersReducedMotion ? open : false))

  useEffect(() => {
    if (prefersReducedMotion) {
      const timerId = window.setTimeout(() => setVisualOpen(open), 0)
      return () => window.clearTimeout(timerId)
    }

    const frameId = window.requestAnimationFrame(() => setVisualOpen(open))
    return () => window.cancelAnimationFrame(frameId)
  }, [open, prefersReducedMotion])

  return (
    <div className={cn('inline-row-expander motion-reduce:transition-none', className)} data-open={visualOpen ? 'true' : 'false'}>
      <div className="inline-row-expander-inner">
        <div className="inline-row-expander-fade motion-reduce:transition-none">{children}</div>
      </div>
    </div>
  )
}
