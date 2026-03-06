import { http, HttpResponse } from 'msw'
import { getDb, paginate } from '../db'
import { ensureAuth, unauthorized } from './utils'

export const historyHandlers = [
  http.get('/api/history', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    let items = [...db.entityHistory]
    const entityType = url.searchParams.get('entityType')
    if (entityType) items = items.filter((item) => item.entityType === entityType)
    const entityPk = url.searchParams.get('entityPk')
    if (entityPk) items = items.filter((item) => item.entityPk === entityPk)
    const from = url.searchParams.get('from')
    if (from) {
      const fromTime = new Date(from).getTime()
      if (!Number.isNaN(fromTime)) {
        items = items.filter((item) => new Date(item.changedAt).getTime() >= fromTime)
      }
    }
    const to = url.searchParams.get('to')
    if (to) {
      const toTime = new Date(to).getTime()
      if (!Number.isNaN(toTime)) {
        items = items.filter((item) => new Date(item.changedAt).getTime() <= toTime)
      }
    }
    return HttpResponse.json(paginate(items, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
]
