import { useEffect, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

export function useStagedMount(open: boolean, delayMs = 140) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [mounted, setMounted] = useState(() => open)

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMounted(open),
      prefersReducedMotion || delayMs <= 0 ? 0 : delayMs,
    )
    return () => window.clearTimeout(timer)
  }, [delayMs, open, prefersReducedMotion])

  return mounted
}
