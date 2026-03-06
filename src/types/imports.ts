export type ImportJobStatus =
  | 'QUEUED'
  | 'VALIDATING'
  | 'READY_TO_APPLY'
  | 'APPLYING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED'

export interface ImportJob {
  id: number
  importType: string
  status: ImportJobStatus
  createdBy: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  sourceFileId: number | null
  errorReportFileId: number | null
  summaryCreated: number
  summaryUpdated: number
  summarySkipped: number
  summaryErrors: number
  pollCount: number
}

export interface ImportRowResult {
  id: number
  importJobId: number
  rowNumber: number
  action: 'CREATE' | 'UPDATE' | 'SKIP'
  errorCode: string | null
  message: string
  rawRowJson: string
}

export interface ImportPreviewResponse {
  summary: Pick<ImportJob, 'summaryCreated' | 'summaryUpdated' | 'summarySkipped' | 'summaryErrors'>
  sampleRows: ImportRowResult[]
}
