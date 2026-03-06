import type { PropsWithChildren, ReactNode } from 'react'
import { Card } from '../primitives/Card'

interface SplitPaneProps {
  list: ReactNode
  detail: ReactNode
}

export function SplitPane({ list, detail }: PropsWithChildren<SplitPaneProps>) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(400px,1fr)]">
      <div className="space-y-4">{list}</div>
      <Card className="h-fit xl:sticky xl:top-24">{detail}</Card>
    </div>
  )
}
