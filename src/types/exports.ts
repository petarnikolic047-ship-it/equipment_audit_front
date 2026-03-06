export type ExportJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface ExportJob {
  id: number
  type: string
  format: 'XLSX' | 'CSV' | 'PDF'
  status: ExportJobStatus
  filterJson: string
  createdBy: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  outputFileId: number | null
  errorMessage: string | null
  pollCount: number
}

export interface ExportCreateDto {
  type: string
  format: 'XLSX' | 'CSV' | 'PDF'
  filterJson: string
}
