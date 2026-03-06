export interface Assignment {
  id: number
  assetId: number
  assetName: string
  assetInventoryNumber: string
  employeeId: number
  employeeFullName: string
  employeeJmbgMasked: string
  takenAt: string
  dueAt: string | null
  returnedAt: string | null
  returnReasonId: number | null
  returnReasonName: string | null
  notes: string | null
  reversFileId: number | null
  employeeActive: boolean
}

export interface AssignmentCreateDto {
  assetId: number
  employeeId: number
  notes: string | null
}

export interface AssignmentCreateResponse {
  assignmentId: number
  documentId: number
  fileId: number
  downloadEndpoint: string
}

export interface AssignmentReturnDto {
  returnReasonId: number
  notes: string | null
}

export interface AssignmentListParams {
  page: number
  pageSize: number
  search?: string
  activeOnly?: string
  employeeId?: number
  assetId?: number
  takenFrom?: string
  takenTo?: string
  overdueReturn?: boolean
  employeeDeactivatedWithActive?: boolean
}
