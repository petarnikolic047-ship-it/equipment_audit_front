import { format } from 'date-fns'

export function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy')
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy HH:mm')
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function maskJmbg(value: string) {
  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`
}
