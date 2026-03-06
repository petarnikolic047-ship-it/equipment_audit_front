export interface AssetGroup {
  id: number
  name: string
  enabled: boolean
}

export interface Category {
  id: number
  groupId: number
  groupName: string
  code: string
  name: string
  enabled: boolean
}

export interface Location {
  id: number
  code: string
  name: string
  enabled: boolean
}

export interface Position {
  id: number
  code: string
  name: string
  enabled: boolean
}

export interface ReturnReason {
  id: number
  code: string
  reasonText: string
  isMalfunction: boolean
  enabled: boolean
}

export interface ReferenceCreateDto {
  code?: string
  name?: string
  reasonText?: string
  isMalfunction?: boolean
  groupId?: number
}
