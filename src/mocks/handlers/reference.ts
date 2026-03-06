import { http, HttpResponse } from 'msw'
import { getDb, nextId, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, notFound, unauthorized } from './utils'

function uniqueByCode<T extends { id: number; code: string }>(list: T[], id: number | null, code: string) {
  return !list.some((item) => item.code.toLowerCase() === code.toLowerCase() && item.id !== id)
}

export const referenceHandlers = [
  http.get('/api/reference/groups', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    return HttpResponse.json(getDb().groups)
  }),
  http.post('/api/reference/groups', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { name?: string }
    if (!payload.name) return badRequest('Name is required.')
    const exists = db.groups.some((item) => item.name.toLowerCase() === payload.name?.toLowerCase())
    if (exists) return conflict('Duplicate group name', 'DUPLICATE_CODE')
    const item = { id: nextId('groups'), name: payload.name, enabled: true }
    db.groups.push(item)
    saveDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  http.put('/api/reference/groups/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.groups.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Group not found')
    const payload = (await request.json()) as { name?: string }
    if (!payload.name) return badRequest('Name is required.')
    item.name = payload.name
    saveDb()
    return HttpResponse.json(item)
  }),
  http.post('/api/reference/groups/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.groups.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Group not found')
    item.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/reference/categories', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    return HttpResponse.json(getDb().categories)
  }),
  http.post('/api/reference/categories', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { code?: string; name?: string; groupId?: number }
    if (!payload.code || !payload.name || !payload.groupId) return badRequest('Code, name and group are required.')
    if (!uniqueByCode(db.categories, null, payload.code)) return conflict('Duplicate category code', 'DUPLICATE_CODE')
    const group = db.groups.find((item) => item.id === payload.groupId)
    if (!group) return badRequest('Invalid group')
    const item = {
      id: nextId('categories'),
      groupId: payload.groupId,
      groupName: group.name,
      code: payload.code,
      name: payload.name,
      enabled: true,
    }
    db.categories.push(item)
    saveDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  http.put('/api/reference/categories/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.categories.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Category not found')
    const payload = (await request.json()) as { name?: string; groupId?: number }
    if (!payload.name) return badRequest('Name is required.')
    item.name = payload.name
    if (payload.groupId) {
      const group = db.groups.find((groupItem) => groupItem.id === payload.groupId)
      if (!group) return badRequest('Invalid group')
      item.groupId = group.id
      item.groupName = group.name
    }
    saveDb()
    return HttpResponse.json(item)
  }),
  http.post('/api/reference/categories/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.categories.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Category not found')
    item.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/reference/locations', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    return HttpResponse.json(getDb().locations)
  }),
  http.post('/api/reference/locations', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { code?: string; name?: string }
    if (!payload.code || !payload.name) return badRequest('Code and name are required.')
    if (!uniqueByCode(db.locations, null, payload.code)) return conflict('Duplicate location code', 'DUPLICATE_CODE')
    const item = { id: nextId('locations'), code: payload.code, name: payload.name, enabled: true }
    db.locations.push(item)
    saveDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  http.put('/api/reference/locations/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.locations.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Location not found')
    const payload = (await request.json()) as { name?: string }
    if (!payload.name) return badRequest('Name is required.')
    item.name = payload.name
    saveDb()
    return HttpResponse.json(item)
  }),
  http.post('/api/reference/locations/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.locations.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Location not found')
    item.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/reference/positions', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    return HttpResponse.json(getDb().positions)
  }),
  http.post('/api/reference/positions', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { code?: string; name?: string }
    if (!payload.code || !payload.name) return badRequest('Code and name are required.')
    if (!uniqueByCode(db.positions, null, payload.code)) return conflict('Duplicate position code', 'DUPLICATE_CODE')
    const item = { id: nextId('positions'), code: payload.code, name: payload.name, enabled: true }
    db.positions.push(item)
    saveDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  http.put('/api/reference/positions/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.positions.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Position not found')
    const payload = (await request.json()) as { name?: string }
    if (!payload.name) return badRequest('Name is required.')
    item.name = payload.name
    saveDb()
    return HttpResponse.json(item)
  }),
  http.post('/api/reference/positions/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.positions.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Position not found')
    item.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/reference/return-reasons', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    return HttpResponse.json(getDb().returnReasons)
  }),
  http.post('/api/reference/return-reasons', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { code?: string; reasonText?: string; isMalfunction?: boolean }
    if (!payload.code || !payload.reasonText) return badRequest('Code and reason text are required.')
    if (!uniqueByCode(db.returnReasons, null, payload.code)) return conflict('Duplicate return reason code', 'DUPLICATE_CODE')
    const item = {
      id: nextId('returnReasons'),
      code: payload.code,
      reasonText: payload.reasonText,
      isMalfunction: Boolean(payload.isMalfunction),
      enabled: true,
    }
    db.returnReasons.push(item)
    saveDb()
    return HttpResponse.json(item, { status: 201 })
  }),
  http.put('/api/reference/return-reasons/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.returnReasons.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Return reason not found')
    const payload = (await request.json()) as { reasonText?: string; isMalfunction?: boolean }
    if (!payload.reasonText) return badRequest('Reason text is required')
    item.reasonText = payload.reasonText
    item.isMalfunction = Boolean(payload.isMalfunction)
    saveDb()
    return HttpResponse.json(item)
  }),
  http.post('/api/reference/return-reasons/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const item = db.returnReasons.find((value) => value.id === Number(params.id))
    if (!item) return notFound('Return reason not found')
    item.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
