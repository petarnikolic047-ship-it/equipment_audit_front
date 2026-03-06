import { useState } from 'react'
import { Card } from '../components/primitives/Card'
import { Button } from '../components/primitives/Button'
import { Drawer } from '../components/primitives/Drawer'
import { FormField } from '../components/patterns/FormField'
import { Select } from '../components/primitives/Select'
import { useCreateExportMutation } from '../features/exports/hooks'
import { useToast } from '../components/patterns/useToast'
import { useNavigate } from 'react-router-dom'

const reportCards = [
  { title: 'Inventory Register', description: 'Export a register of all assets.' },
  { title: 'Current Assignments', description: 'Export report for active assignments.' },
  { title: 'Asset History', description: 'Export change history for assets.' },
  { title: 'Employee History', description: 'Export change history for employees.' },
  { title: 'Audit Log Export', description: 'Export system and business audit logs.' },
]

export default function ReportsPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('Inventory Register')
  const [format, setFormat] = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const mutation = useCreateExportMutation()
  const navigate = useNavigate()
  const { showToast } = useToast()

  return (
    <>
      <section className="space-y-4">
        <Card>
          <p className="text-sm text-slate-200">
            Reports is the export builder. Run a report here, then track completion and download output in Exports.
          </p>
        </Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((report) => (
            <Card key={report.title}>
              <h3 className="text-lg font-semibold text-slate-100">{report.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{report.description}</p>
              <Button
                className="mt-4"
                variant="primary"
                onClick={() => {
                  setSelectedType(report.title)
                  setPanelOpen(true)
                }}
              >
                Run Report
              </Button>
            </Card>
          ))}
        </div>
      </section>
      <Drawer open={panelOpen} title="Run Report" onClose={() => setPanelOpen(false)}>
        <div className="space-y-3">
          <FormField label="Report Type">
            <Select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              {reportCards.map((report) => (
                <option key={report.title}>{report.title}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status Filter">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_STOCK">In stock</option>
              <option value="UNDER_SERVICE">Under service</option>
            </Select>
          </FormField>
          <FormField label="Format">
            <Select value={format} onChange={(event) => setFormat(event.target.value as 'XLSX' | 'CSV' | 'PDF')}>
              <option value="XLSX">XLSX</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const result = await mutation.mutateAsync({
                    type: selectedType,
                    format,
                    filterJson: JSON.stringify({ status: statusFilter }),
                  })
                  showToast(`Report queued as export #${result.exportJobId}`, 'success')
                  setPanelOpen(false)
                  navigate(`/exports/${result.exportJobId}`)
                } catch (error) {
                  showToast((error as { message?: string }).message ?? 'Failed to queue report', 'error')
                }
              }}
            >
              Run Report
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}
