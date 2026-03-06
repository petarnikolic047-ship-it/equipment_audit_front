import { http, HttpResponse } from 'msw'
import { filterBySearch, getDb, paginate } from '../db'
import { ensureAuth, unauthorized } from './utils'

export const auditHandlers = [
  http.get('/api/audit/events', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    let events = [...db.auditEvents]
    events = filterBySearch(events, url.searchParams.get('search'), (item) => [item.eventType, item.entityType, item.entityId, item.actor])
    const entityType = url.searchParams.get('entityType')
    if (entityType) events = events.filter((item) => item.entityType === entityType)
    const entityId = url.searchParams.get('entityId')
    if (entityId) events = events.filter((item) => item.entityId === entityId)
    return HttpResponse.json(paginate(events, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/logs/system', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    return HttpResponse.json(paginate(db.systemLogs, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
]
