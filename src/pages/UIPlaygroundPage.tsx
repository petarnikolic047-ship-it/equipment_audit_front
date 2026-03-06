import { Card } from '../components/primitives/Card'
import { Button } from '../components/primitives/Button'
import { StatusBadge } from '../components/primitives/StatusBadge'
import { Tabs } from '../components/primitives/Tabs'
import { Input } from '../components/primitives/Input'
import { Select } from '../components/primitives/Select'
import { Textarea } from '../components/primitives/Textarea'
import { useState } from 'react'
import { Dialog } from '../components/primitives/Dialog'
import { Drawer } from '../components/primitives/Drawer'
import { LoadingState } from '../components/patterns/LoadingState'
import { EmptyState } from '../components/patterns/EmptyState'
import { ErrorState } from '../components/patterns/ErrorState'

const tabs = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
]

const statuses = ['ASSIGNED', 'IN_STOCK', 'UNDER_SERVICE', 'FAILED', 'COMPLETED', 'RUNNING', 'QUEUED']

export default function UIPlaygroundPage() {
  const [tab, setTab] = useState('one')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Card title="Buttons & Badges">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Card>

      <Card title="Inputs">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Text input" />
          <Select defaultValue="">
            <option value="">Select value</option>
            <option value="A">A</option>
          </Select>
        </div>
        <Textarea className="mt-3" rows={3} placeholder="Textarea" />
      </Card>

      <Card title="Tabs, States, Overlays">
        <Tabs items={tabs} activeId={tab} onChange={setTab} />
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <LoadingState />
          <EmptyState title="No records" description="Empty state preview" />
          <ErrorState message="Error state preview" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        </div>
      </Card>

      <Dialog open={dialogOpen} title="Dialog Preview" onClose={() => setDialogOpen(false)}>
        <p className="text-sm text-slate-300">Reusable dialog primitive preview.</p>
      </Dialog>
      <Drawer open={drawerOpen} title="Drawer Preview" onClose={() => setDrawerOpen(false)}>
        <p className="text-sm text-slate-300">Reusable drawer primitive preview.</p>
      </Drawer>
    </div>
  )
}
