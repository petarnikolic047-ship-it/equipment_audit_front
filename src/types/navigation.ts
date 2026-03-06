import type { AppRoutePath } from '../routes/routePaths'

export interface NavigationItem {
  id: string
  label: string
  path: AppRoutePath
  permission?: PermissionCode
  hiddenInProduction?: boolean
}

export type PermissionCode =
  | 'ASSET_EDIT'
  | 'EMPLOYEE_EDIT'
  | 'REFERENCE_MANAGE'
  | 'ATTRIBUTE_MANAGE'
  | 'EXPORT_RUN'
  | 'IMPORT_RUN'
  | 'STOCKTAKE_RUN'
  | 'AUDIT_VIEW'
