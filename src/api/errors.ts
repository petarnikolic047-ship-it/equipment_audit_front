import { AxiosError } from 'axios'
import type { ApiErrorPayload } from './schemas/common'

export interface NormalizedApiError {
  status: number
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export const defaultApiError: NormalizedApiError = {
  status: 500,
  code: 'UNKNOWN_ERROR',
  message: 'Unexpected error occurred.',
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined
    if (payload && typeof payload.status === 'number') {
      return {
        status: payload.status,
        code: payload.code,
        message: payload.message,
        fieldErrors: payload.fieldErrors,
      }
    }
    return {
      status: error.response?.status ?? 500,
      code: 'HTTP_ERROR',
      message: error.message,
    }
  }
  if (error instanceof Error) {
    return { ...defaultApiError, message: error.message }
  }
  return defaultApiError
}
