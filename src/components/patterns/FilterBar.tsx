import { Search } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Button } from '../primitives/Button'
import { Input } from '../primitives/Input'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onReset: () => void
  actions?: ReactNode
  filtersClassName?: string
  showResetButton?: boolean
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onReset,
  actions,
  filtersClassName,
  showResetButton = true,
  children,
}: PropsWithChildren<FilterBarProps>) {
  return (
    <div className="brand-outline rounded-sm bg-card/90 p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
          <Input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} className="pl-9" placeholder="Search inventory, person, ID..." />
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showResetButton ? <Button onClick={onReset}>Reset</Button> : null}
        </div>
      </div>
      {children ? (
        <div className={['mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4', filtersClassName].filter(Boolean).join(' ')}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
