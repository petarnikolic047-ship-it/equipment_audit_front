export type AssetStatus = 'IN_STOCK' | 'ASSIGNED' | 'UNDER_SERVICE' | 'DISABLED'

export interface Asset {
  id: number
  inventoryNumber: string
  name: string
  categoryId: number
  categoryName: string
  groupId: number
  locationId: number | null
  locationName: string | null
  serialNumber: string | null
  status: AssetStatus
  purchaseDate: string | null
  activationDate: string | null
  purchaseValue: number | null
  comment: string | null
  isActive: boolean
  isMissing: boolean
  lastSeenAuditAt: string | null
}

export interface AssetListParams {
  page: number
  pageSize: number
  search?: string
  categoryId?: number
  locationId?: number
  assignedToEmployeeId?: number
  missing?: boolean
  seenInLastAudit?: boolean
  status?: AssetStatus
  active?: boolean
}

export interface AssetCreateDto {
  name: string
  categoryId: number
  locationId: number | null
  serialNumber: string | null
  purchaseDate: string | null
  activationDate: string | null
  purchaseValue: number | null
  comment: string | null
  attributes: AssetAttributeInput[]
}

export type AssetUpdateDto = AssetCreateDto

export interface AssetAttributeInput {
  attributeId: number
  valueInteger?: number
  valueBoolean?: boolean
  valueString?: string
  valueEnumOptionId?: number
  valueEmployeeId?: number
}

export interface AssetCreateResponse {
  id: number
  inventoryNumber: string
}
