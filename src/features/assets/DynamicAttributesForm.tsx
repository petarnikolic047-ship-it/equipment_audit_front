import type { AssetAttributeInput } from '../../types/asset'
import type { AttributeDefinition, EnumOption } from '../../types/attributes'
import type { Employee } from '../../types/employee'
import { FormField } from '../../components/patterns/FormField'
import { Input } from '../../components/primitives/Input'
import { Select } from '../../components/primitives/Select'

interface DynamicAttributesFormProps {
  definitions: AttributeDefinition[]
  enumOptions: EnumOption[]
  employees: Employee[]
  values: AssetAttributeInput[]
  onChange: (values: AssetAttributeInput[]) => void
}

function upsert(values: AssetAttributeInput[], update: AssetAttributeInput) {
  const existingIndex = values.findIndex((item) => item.attributeId === update.attributeId)
  if (existingIndex >= 0) {
    const cloned = [...values]
    cloned[existingIndex] = update
    return cloned
  }
  return [...values, update]
}

export function DynamicAttributesForm({ definitions, enumOptions, employees, values, onChange }: DynamicAttributesFormProps) {
  if (definitions.length === 0) {
    return <p className="text-sm text-slate-400">No dynamic attributes for selected category group.</p>
  }

  return (
    <div className="grid gap-3">
      {definitions
        .filter((definition) => definition.enabled)
        .map((definition) => {
          const current = values.find((value) => value.attributeId === definition.id)
          const commonLabel = `${definition.label}${definition.required ? ' *' : ''}`
          if (definition.valueType === 'INTEGER') {
            return (
              <FormField key={definition.id} label={commonLabel}>
                <Input
                  type="number"
                  value={current?.valueInteger ?? ''}
                  onChange={(event) =>
                    onChange(
                      upsert(values, {
                        attributeId: definition.id,
                        valueInteger: event.target.value === '' ? undefined : Number(event.target.value),
                      }),
                    )
                  }
                />
              </FormField>
            )
          }
          if (definition.valueType === 'BOOLEAN') {
            return (
              <FormField key={definition.id} label={commonLabel}>
                <Select
                  value={typeof current?.valueBoolean === 'boolean' ? String(current.valueBoolean) : ''}
                  onChange={(event) =>
                    onChange(
                      upsert(values, {
                        attributeId: definition.id,
                        valueBoolean: event.target.value === '' ? undefined : event.target.value === 'true',
                      }),
                    )
                  }
                >
                  <option value="">Select value</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </FormField>
            )
          }
          if (definition.valueType === 'STRING') {
            return (
              <FormField key={definition.id} label={commonLabel}>
                <Input
                  value={current?.valueString ?? ''}
                  onChange={(event) => onChange(upsert(values, { attributeId: definition.id, valueString: event.target.value }))}
                />
              </FormField>
            )
          }
          if (definition.valueType === 'ENUM') {
            const attributeOptions = enumOptions.filter((option) => option.attributeId === definition.id)
            const selectedOption = attributeOptions.find((option) => option.id === current?.valueEnumOptionId)
            const options = attributeOptions.filter((option) => option.enabled)
            if (selectedOption && !selectedOption.enabled && !options.some((option) => option.id === selectedOption.id)) {
              options.push(selectedOption)
            }
            return (
              <FormField key={definition.id} label={commonLabel}>
                <Select
                  value={current?.valueEnumOptionId ?? ''}
                  onChange={(event) =>
                    onChange(
                      upsert(values, {
                        attributeId: definition.id,
                        valueEnumOptionId: event.target.value ? Number(event.target.value) : undefined,
                      }),
                    )
                  }
                >
                  <option value="">Select option</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.value}
                      {!option.enabled ? ' (disabled - historical)' : ''}
                    </option>
                  ))}
                </Select>
              </FormField>
            )
          }
          return (
            <FormField key={definition.id} label={commonLabel}>
              <Select
                value={current?.valueEmployeeId ?? ''}
                onChange={(event) =>
                  onChange(
                    upsert(values, {
                      attributeId: definition.id,
                      valueEmployeeId: event.target.value ? Number(event.target.value) : undefined,
                    }),
                  )
                }
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
          )
        })}
    </div>
  )
}
