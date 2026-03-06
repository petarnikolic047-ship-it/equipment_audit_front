import axios from 'axios'
import type { ZodType } from 'zod'
import { useAuthStore } from '../features/auth/authStore'
import { normalizeApiError } from './errors'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error)
    if (normalized.status === 401) {
      useAuthStore.getState().logout()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(normalized)
  },
)

export async function getParsed<T, TParams extends object = Record<string, unknown>>(
  url: string,
  schema: ZodType<T>,
  params?: TParams,
) {
  const response = await apiClient.get(url, { params })
  return schema.parse(response.data)
}

export async function postParsed<TBody, TResponse>(
  url: string,
  body: TBody,
  schema: ZodType<TResponse>,
  config?: { headers?: Record<string, string> },
) {
  const response = await apiClient.post(url, body, config)
  return schema.parse(response.data)
}

export async function putParsed<TBody, TResponse>(url: string, body: TBody, schema: ZodType<TResponse>) {
  const response = await apiClient.put(url, body)
  return schema.parse(response.data)
}
