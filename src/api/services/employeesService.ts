import { apiClient, getParsed, postParsed, putParsed } from '../client'
import { employeeListSchema, employeeSchema } from '../schemas/employee'
import type { PagedResult } from '../httpTypes'
import type { Employee, EmployeeCreateDto, EmployeeListParams, EmployeeUpdateDto } from '../../types/employee'

export async function fetchEmployees(params: EmployeeListParams): Promise<PagedResult<Employee>> {
  return getParsed('/employees', employeeListSchema, params)
}

export async function fetchEmployee(id: number): Promise<Employee> {
  return getParsed(`/employees/${id}`, employeeSchema)
}

export async function createEmployee(payload: EmployeeCreateDto): Promise<Employee> {
  return postParsed('/employees', payload, employeeSchema)
}

export async function updateEmployee(id: number, payload: EmployeeUpdateDto): Promise<Employee> {
  return putParsed(`/employees/${id}`, payload, employeeSchema)
}

export async function deactivateEmployee(id: number): Promise<void> {
  await apiClient.post(`/employees/${id}/deactivate`)
}
