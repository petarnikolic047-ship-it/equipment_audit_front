import { http, HttpResponse } from 'msw'
import { filterBySearch, getDb, nextId, paginate, saveDb } from '../db'
import type { AssetMutationPayload } from '../mockTypes'
import { badRequest, ensureAuth, forbidden, getAuthPrincipal, notFound, unauthorized } from './utils'

function validateTypedValue(input: { valueInteger?: number; valueBoolean?: boolean; valueString?: string; valueEnumOptionId?: number; valueEmployeeId?: number }) {
  const values = [input.valueInteger, input.valueBoolean, input.valueString, input.valueEnumOptionId, input.valueEmployeeId].filter(
    (item) => item !== undefined && item !== null && item !== '',
  )
  return values.length === 1
}

function parseAssetPayload(raw: unknown): AssetMutationPayload {
  const body = raw as AssetMutationPayload
  return {
    name: body.name,
    categoryId: body.categoryId,
    locationId: body.locationId ?? null,
    serialNumber: body.serialNumber ?? null,
    purchaseDate: body.purchaseDate ?? null,
    activationDate: body.activationDate ?? null,
    purchaseValue: body.purchaseValue ?? null,
    comment: body.comment ?? null,
    attributes: body.attributes ?? [],
  }
}

function validateAttributeIntegrity(
  db: ReturnType<typeof getDb>,
  groupId: number,
  assetId: number | null,
  input: {
    attributeId: number
    valueEnumOptionId?: number
    valueEmployeeId?: number
  },
) {
  const definition = db.attributes.find((item) => item.id === input.attributeId && item.groupId === groupId && item.enabled)
  if (!definition) return 'Attribute does not belong to selected category group.'

  if (definition.valueType === 'ENUM') {
    if (!input.valueEnumOptionId) return 'ENUM attribute requires enum option value.'
    const option = db.enumOptions.find(
      (item) => item.id === input.valueEnumOptionId && item.attributeId === definition.id,
    )
    if (!option) return 'Invalid enum option for selected attribute.'
    if (!option.enabled) {
      const hasHistoricalValue = assetId
        ? db.assetAttributeValues.some(
            (row) =>
              row.assetId === assetId &&
              row.attributeId === definition.id &&
              row.valueEnumOptionId === option.id,
          )
        : false
      if (!hasHistoricalValue) return 'Selected enum option is disabled.'
    }
  }

  if (definition.valueType === 'EMPLOYEE_REF' && input.valueEmployeeId) {
    const employee = db.employees.find((item) => item.id === input.valueEmployeeId && item.isActive)
    if (!employee) return 'Invalid employee reference in attribute.'
  }

  return null
}

function generateInventoryNumber(categoryCode: string, sequence: number) {
  return `${categoryCode}-${String(sequence).padStart(4, '0')}`
}

function normalizeAssetStatus(
  db: ReturnType<typeof getDb>,
  asset: ReturnType<typeof getDb>['assets'][number],
) {
  if (asset.status === 'IN_STOCK') {
    const hasActiveAssignment = db.assignments.some((assignment) => assignment.assetId === asset.id && !assignment.returnedAt)
    if (hasActiveAssignment) return 'ASSIGNED'
  }
  return asset.status
}

function mapAssetForResponse(
  db: ReturnType<typeof getDb>,
  asset: ReturnType<typeof getDb>['assets'][number],
) {
  return {
    ...asset,
    status: normalizeAssetStatus(db, asset),
    isMissing: asset.isMissing ?? false,
    lastSeenAuditAt: asset.lastSeenAuditAt ?? null,
  }
}

export const assetHandlers = [
  http.get('/api/dashboard/stats', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    return HttpResponse.json({
      assets: db.assets.filter((item) => item.isActive).length,
      activeAssignments: db.assignments.filter((item) => !item.returnedAt).length,
      employees: db.employees.filter((item) => item.isActive).length,
      importJobs: db.importJobs.filter((item) => ['QUEUED', 'VALIDATING', 'APPLYING'].includes(item.status)).length,
    })
  }),
  http.get('/api/assets', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    let assets = db.assets.map((asset) => mapAssetForResponse(db, asset))
    assets = filterBySearch(assets, url.searchParams.get('search'), (item) => [
      item.inventoryNumber,
      item.name,
      item.serialNumber ?? '',
      item.categoryName,
      item.locationName ?? '',
    ])
    const categoryId = url.searchParams.get('categoryId')
    if (categoryId) {
      assets = assets.filter((item) => item.categoryId === Number(categoryId))
    }
    const locationId = url.searchParams.get('locationId')
    if (locationId) {
      assets = assets.filter((item) => item.locationId === Number(locationId))
    }
    const status = url.searchParams.get('status')
    if (status) {
      assets = assets.filter((item) => item.status === status)
    }
    const assignedToEmployeeId = url.searchParams.get('assignedToEmployeeId')
    if (assignedToEmployeeId) {
      const employeeId = Number(assignedToEmployeeId)
      const assignedAssetIds = new Set(
        db.assignments.filter((item) => item.employeeId === employeeId && !item.returnedAt).map((item) => item.assetId),
      )
      assets = assets.filter((item) => assignedAssetIds.has(item.id))
    }
    const missing = url.searchParams.get('missing')
    if (missing) {
      assets = assets.filter((item) => item.isMissing === (missing === 'true'))
    }
    const seenInLastAudit = url.searchParams.get('seenInLastAudit')
    if (seenInLastAudit) {
      assets = assets.filter((item) => (item.lastSeenAuditAt !== null) === (seenInLastAudit === 'true'))
    }
    const active = url.searchParams.get('active')
    if (active) {
      assets = assets.filter((item) => item.isActive === (active === 'true'))
    }
    if (principal.role === 'EMPLOYEE') {
      const visibleAssetIds = new Set(
        db.assignments
          .filter((assignment) => assignment.employeeId === principal.employeeId)
          .map((assignment) => assignment.assetId),
      )
      assets = assets.filter((item) => visibleAssetIds.has(item.id))
    }
    return HttpResponse.json(paginate(assets, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/assets/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE') {
      const isVisible = db.assignments.some((item) => item.assetId === assetId && item.employeeId === principal.employeeId)
      if (!isVisible) return forbidden('ASSET_EDIT')
    }
    const currentAssignment = db.assignments.find((item) => item.assetId === assetId && !item.returnedAt)
    const attributes = db.assetAttributeValues.filter((item) => item.assetId === assetId)
    return HttpResponse.json({
      asset: mapAssetForResponse(db, asset),
      attributes,
      currentAssignmentId: currentAssignment?.id ?? null,
    })
  }),
  http.post('/api/assets', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const payload = parseAssetPayload(await request.json())
    if (!payload.name || !payload.categoryId) {
      return badRequest('Name and category are required.')
    }
    const category = db.categories.find((item) => item.id === payload.categoryId && item.enabled)
    if (!category) return badRequest('Invalid category.')
    if (payload.locationId) {
      const location = db.locations.find((item) => item.id === payload.locationId && item.enabled)
      if (!location) return badRequest('Invalid location.')
    }
    const requiredAttributes = db.attributes.filter((item) => item.groupId === category.groupId && item.enabled && item.required)
    const selectedAttributes = payload.attributes
    for (const required of requiredAttributes) {
      if (!selectedAttributes.find((attr) => attr.attributeId === required.id)) {
        return badRequest(`Missing required attribute: ${required.label}`)
      }
    }
    for (const attr of selectedAttributes) {
      if (!validateTypedValue(attr)) {
        return badRequest('Exactly one typed value must be provided per attribute.')
      }
      const integrityError = validateAttributeIntegrity(db, category.groupId, null, attr)
      if (integrityError) return badRequest(integrityError)
    }
    const assetId = nextId('assets')
    const inventoryNumber = generateInventoryNumber(category.code, assetId)
    const location = db.locations.find((item) => item.id === payload.locationId) ?? null
    db.assets.push({
      id: assetId,
      inventoryNumber,
      name: payload.name,
      categoryId: category.id,
      categoryName: category.name,
      groupId: category.groupId,
      locationId: location?.id ?? null,
      locationName: location?.name ?? null,
      serialNumber: payload.serialNumber,
      status: 'IN_STOCK',
      purchaseDate: payload.purchaseDate,
      activationDate: payload.activationDate,
      purchaseValue: payload.purchaseValue,
      comment: payload.comment,
      isActive: true,
      isMissing: false,
      lastSeenAuditAt: null,
    })
    for (const attr of selectedAttributes) {
      db.assetAttributeValues.push({
        id: nextId('assetAttributeValues'),
        assetId,
        attributeId: attr.attributeId,
        valueInteger: attr.valueInteger ?? null,
        valueBoolean: attr.valueBoolean ?? null,
        valueString: attr.valueString ?? null,
        valueEnumOptionId: attr.valueEnumOptionId ?? null,
        valueEmployeeId: attr.valueEmployeeId ?? null,
      })
    }
    const now = new Date().toISOString()
    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId,
      eventType: 'ASSET_CREATED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: `Created with inventory number ${inventoryNumber}`,
    })
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: String(assetId),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ inventoryNumber }),
    })
    db.entityHistory.push({
      id: nextId('entityHistory'),
      auditRevisionId: Date.now(),
      changedAt: now,
      entityType: 'ASSET',
      entityPk: String(assetId),
      operation: 'INSERT',
      oldRowJson: null,
      newRowJson: JSON.stringify({ inventoryNumber, status: 'IN_STOCK' }),
    })
    saveDb()
    return HttpResponse.json({ id: assetId, inventoryNumber }, { status: 201 })
  }),
  http.put('/api/assets/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    const payload = parseAssetPayload(await request.json())
    const category = db.categories.find((item) => item.id === payload.categoryId && item.enabled)
    if (!category) return badRequest('Invalid category')
    const location = payload.locationId ? db.locations.find((item) => item.id === payload.locationId && item.enabled) : null
    if (payload.locationId && !location) return badRequest('Invalid location')
    const requiredAttributes = db.attributes.filter((item) => item.groupId === category.groupId && item.enabled && item.required)
    const selectedAttributes = payload.attributes
    for (const required of requiredAttributes) {
      if (!selectedAttributes.find((attr) => attr.attributeId === required.id)) {
        return badRequest(`Missing required attribute: ${required.label}`)
      }
    }
    for (const attr of selectedAttributes) {
      if (!validateTypedValue(attr)) {
        return badRequest('Exactly one typed value must be provided per attribute.')
      }
      const integrityError = validateAttributeIntegrity(db, category.groupId, assetId, attr)
      if (integrityError) return badRequest(integrityError)
    }
    const oldSnapshot = {
      name: asset.name,
      categoryId: asset.categoryId,
      locationId: asset.locationId,
      status: asset.status,
    }
    asset.name = payload.name
    asset.categoryId = category.id
    asset.categoryName = category.name
    asset.groupId = category.groupId
    asset.locationId = location?.id ?? null
    asset.locationName = location?.name ?? null
    asset.serialNumber = payload.serialNumber
    asset.purchaseDate = payload.purchaseDate
    asset.activationDate = payload.activationDate
    asset.purchaseValue = payload.purchaseValue
    asset.comment = payload.comment
    db.assetAttributeValues = db.assetAttributeValues.filter((item) => item.assetId !== assetId)
    for (const attr of selectedAttributes) {
      db.assetAttributeValues.push({
        id: nextId('assetAttributeValues'),
        assetId,
        attributeId: attr.attributeId,
        valueInteger: attr.valueInteger ?? null,
        valueBoolean: attr.valueBoolean ?? null,
        valueString: attr.valueString ?? null,
        valueEnumOptionId: attr.valueEnumOptionId ?? null,
        valueEmployeeId: attr.valueEmployeeId ?? null,
      })
    }
    const now = new Date().toISOString()
    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId,
      eventType: 'ASSET_UPDATED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: 'Asset details updated',
    })
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'ASSET_UPDATED',
      entityType: 'ASSET',
      entityId: String(asset.id),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ changedFields: ['name', 'categoryId', 'locationId'] }),
    })
    db.entityHistory.push({
      id: nextId('entityHistory'),
      auditRevisionId: Date.now(),
      changedAt: now,
      entityType: 'ASSET',
      entityPk: String(asset.id),
      operation: 'UPDATE',
      oldRowJson: JSON.stringify(oldSnapshot),
      newRowJson: JSON.stringify({
        name: asset.name,
        categoryId: asset.categoryId,
        locationId: asset.locationId,
        status: asset.status,
      }),
    })
    saveDb()
    return HttpResponse.json(asset)
  }),
  http.post('/api/assets/:id/disable', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (principal.role !== 'ADMIN') return forbidden('ASSET_EDIT')
    const db = getDb()
    const asset = db.assets.find((item) => item.id === Number(params.id))
    if (!asset) return notFound('Asset not found')
    const payload = (await request.json()) as { reason?: string }
    const reason = payload.reason?.trim()
    if (!reason) return badRequest('Disable reason is required for manual override.')
    const oldStatus = asset.status
    asset.isActive = false
    asset.status = 'DISABLED'
    const now = new Date().toISOString()
    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId: asset.id,
      eventType: 'ASSET_DISABLED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'MANUAL_OVERRIDE',
      note: reason,
    })
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'ASSET_DISABLED',
      entityType: 'ASSET',
      entityId: String(asset.id),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ reason }),
    })
    db.entityHistory.push({
      id: nextId('entityHistory'),
      auditRevisionId: Date.now(),
      changedAt: now,
      entityType: 'ASSET',
      entityPk: String(asset.id),
      operation: 'UPDATE',
      oldRowJson: JSON.stringify({ status: oldStatus, isActive: true }),
      newRowJson: JSON.stringify({ status: asset.status, isActive: false }),
    })
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
