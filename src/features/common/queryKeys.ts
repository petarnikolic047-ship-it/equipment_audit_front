import type { AssetListParams } from '../../types/asset'
import type { AssignmentListParams } from '../../types/assignment'
import type { EmployeeListParams } from '../../types/employee'

export const queryKeys = {
  assets: {
    root: ['assets'] as const,
    list: (params: AssetListParams) => ['assets', 'list', params] as const,
    detail: (id?: number) => ['assets', 'detail', id] as const,
  },
  assetDetail: {
    root: ['asset-detail'] as const,
    byId: (id?: number) => ['asset-detail', id] as const,
  },
  employees: {
    root: ['employees'] as const,
    list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
    detail: (id?: number) => ['employees', 'detail', id] as const,
  },
  employeeDetail: {
    root: ['employee-detail'] as const,
    byId: (id?: number) => ['employee-detail', id] as const,
  },
  assignments: {
    root: ['assignments'] as const,
    list: (params: AssignmentListParams) => ['assignments', 'list', params] as const,
    detail: (id?: number) => ['assignments', 'detail', id] as const,
  },
  assignment: {
    root: ['assignment'] as const,
    byId: (id?: number) => ['assignment', id] as const,
  },
  myEquipment: {
    root: ['my-equipment'] as const,
    byUser: (userId?: number) => ['my-equipment', userId] as const,
  },
} as const

