export interface Employee {
  id: number
  firstName: string
  lastName: string
  jmbg: string
  phone: string
  address: string | null
  positionId: number
  positionName: string
  isActive: boolean
  deactivatedAt: string | null
  hasActiveAssignments?: boolean
}

export interface EmployeeListParams {
  page: number
  pageSize: number
  search?: string
  positionId?: number
  active?: boolean
  hasAssets?: boolean
}

export interface EmployeeCreateDto {
  firstName: string
  lastName: string
  jmbg: string
  phone: string
  address: string | null
  positionId: number
}

export type EmployeeUpdateDto = EmployeeCreateDto
