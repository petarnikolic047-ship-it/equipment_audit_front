import { Card } from '../components/primitives/Card'
import { useDashboardStatsQuery } from '../features/dashboard/hooks'
import { LoadingState } from '../components/patterns/LoadingState'

export default function DashboardPage() {
  const stats = useDashboardStatsQuery()
  const statCards = [
    { label: 'Assets', value: stats.data?.assets ?? 0 },
    { label: 'Active Assignments', value: stats.data?.activeAssignments ?? 0 },
    { label: 'Employees', value: stats.data?.employees ?? 0 },
    { label: 'Open Import Jobs', value: stats.data?.importJobs ?? 0 },
  ]

  return (
    <section className="space-y-6">
      {stats.isLoading ? <LoadingState text="Loading dashboard..." /> : null}
      <Card className="brand-camo-blue overflow-hidden p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="brand-display text-sm tracking-[0.14em] text-brand-100">Inforce Operations</p>
            <h2 className="brand-display mt-1 text-5xl leading-[0.92] text-white">Asset Command Center</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Live control of issue, transfer, return, and service workflows with full audit visibility.
            </p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <p className="brand-display text-[12px] tracking-[0.08em] text-slate-300">{item.label}</p>
            <p className="brand-display mt-2 text-5xl leading-none text-brand-100">{item.value}</p>
          </Card>
        ))}
      </div>
      <Card title="Operational Summary">
        <p className="text-sm text-slate-300">
          This dashboard is backed by MSW handlers and mirrors the production API contract, including auth/session behavior.
        </p>
      </Card>
    </section>
  )
}
