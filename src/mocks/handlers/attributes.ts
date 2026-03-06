import { http, HttpResponse } from 'msw'
import { getDb, nextId, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, notFound, unauthorized } from './utils'

export const attributesHandlers = [
  http.get('/api/admin/attributes', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const groupId = Number(new URL(request.url).searchParams.get('groupId'))
    return HttpResponse.json(db.attributes.filter((item) => item.groupId === groupId))
  }),
  http.post('/api/admin/attributes', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { groupId?: number; label?: string; valueType?: string; required?: boolean }
    if (!payload.groupId || !payload.label || !payload.valueType) return badRequest('Missing required fields.')
    const exists = db.attributes.some(
      (item) => item.groupId === payload.groupId && item.label.toLowerCase() === payload.label?.toLowerCase() && item.enabled,
    )
    if (exists) return conflict('Duplicate attribute label in selected group', 'DUPLICATE_ATTRIBUTE')
    const attribute = {
      id: nextId('attributes'),
      groupId: payload.groupId,
      label: payload.label,
      valueType: payload.valueType as 'INTEGER' | 'BOOLEAN' | 'STRING' | 'ENUM' | 'EMPLOYEE_REF',
      required: Boolean(payload.required),
      enabled: true,
    }
    db.attributes.push(attribute)
    saveDb()
    return HttpResponse.json(attribute, { status: 201 })
  }),
  http.put('/api/admin/attributes/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const attribute = db.attributes.find((item) => item.id === Number(params.id))
    if (!attribute) return notFound('Attribute not found')
    const payload = (await request.json()) as { label?: string; required?: boolean }
    if (payload.label) attribute.label = payload.label
    if (typeof payload.required === 'boolean') attribute.required = payload.required
    saveDb()
    return HttpResponse.json(attribute)
  }),
  http.post('/api/admin/attributes/:id/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const attribute = db.attributes.find((item) => item.id === Number(params.id))
    if (!attribute) return notFound('Attribute not found')
    attribute.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/admin/attributes/:id/options', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    return HttpResponse.json(db.enumOptions.filter((item) => item.attributeId === Number(params.id)))
  }),
  http.post('/api/admin/attributes/:id/options', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const attributeId = Number(params.id)
    const payload = (await request.json()) as { value?: string }
    if (!payload.value) return badRequest('Value is required')
    const exists = db.enumOptions.some(
      (item) => item.attributeId === attributeId && item.value.toLowerCase() === payload.value?.toLowerCase(),
    )
    if (exists) return conflict('Duplicate enum option', 'DUPLICATE_OPTION')
    const option = {
      id: nextId('enumOptions'),
      attributeId,
      value: payload.value,
      enabled: true,
    }
    db.enumOptions.push(option)
    saveDb()
    return HttpResponse.json(option, { status: 201 })
  }),
  http.post('/api/admin/options/:optionId/disable', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const option = db.enumOptions.find((item) => item.id === Number(params.optionId))
    if (!option) return notFound('Option not found')
    option.enabled = false
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
