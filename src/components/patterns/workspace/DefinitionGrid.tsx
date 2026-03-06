import { DefinitionList, type DefinitionListItem } from '../DefinitionList'

export type DefinitionGridItem = DefinitionListItem

interface DefinitionGridProps {
  items: DefinitionGridItem[]
  className?: string
  rowClassName?: string
  labelClassName?: string
  valueClassName?: string
}

export function DefinitionGrid({ items, className, rowClassName, labelClassName, valueClassName }: DefinitionGridProps) {
  return (
    <DefinitionList
      items={items}
      className={className}
      rowClassName={rowClassName}
      labelClassName={labelClassName}
      valueClassName={valueClassName}
    />
  )
}
