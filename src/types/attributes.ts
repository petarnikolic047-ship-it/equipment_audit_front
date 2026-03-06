export type AttributeValueType = 'INTEGER' | 'BOOLEAN' | 'STRING' | 'ENUM' | 'EMPLOYEE_REF'

export interface AttributeDefinition {
  id: number
  groupId: number
  label: string
  valueType: AttributeValueType
  required: boolean
  enabled: boolean
}

export interface EnumOption {
  id: number
  attributeId: number
  value: string
  enabled: boolean
}

export interface AssetAttributeValue {
  id: number
  assetId: number
  attributeId: number
  valueInteger: number | null
  valueBoolean: boolean | null
  valueString: string | null
  valueEnumOptionId: number | null
  valueEmployeeId: number | null
}

export interface AttributeCreateDto {
  groupId: number
  label: string
  valueType: AttributeValueType
  required: boolean
}
