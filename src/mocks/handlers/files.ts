import { http, HttpResponse } from 'msw'
import { getDb } from '../db'
import { ensureAuth, notFound, unauthorized } from './utils'

export const filesHandlers = [
  http.get('/api/files/:id/download', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const file = getDb().files.find((item) => item.id === Number(params.id))
    if (!file) return notFound('File not found')
    return HttpResponse.json({
      url: `https://mock-storage.local/${file.storageKey}?download=${encodeURIComponent(file.originalName)}`,
    })
  }),
]
