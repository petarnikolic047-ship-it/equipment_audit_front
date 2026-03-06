import { http, HttpResponse } from 'msw'
import { filterBySearch, getDb, nextId, paginate, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, notFound, unauthorized } from './utils'

function resolveDiscrepancy(
  found: boolean,
  expectedLocationName: string | null,
  actualLocationName: string | null,
): 'NONE' | 'MISSING' | 'LOCATION_MISMATCH' | 'STATUS_MISMATCH' {
  if (!found) return 'MISSING'
  if (expectedLocationName && actualLocationName && expectedLocationName !== actualLocationName) {
    return 'LOCATION_MISMATCH'
  }
  return 'NONE'
}

export const stocktakeHandlers = [
  http.get('/api/stocktakes', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)

    let audits = [...db.stocktakeAudits]
    audits = filterBySearch(audits, url.searchParams.get('search'), (item) => [item.name, item.scopeLocationName ?? '', item.scopeCategoryName ?? ''])

    const status = url.searchParams.get('status')
    if (status) {
      audits = audits.filter((item) => item.status === status)
    }

    return HttpResponse.json(paginate(audits, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),

  http.post('/api/stocktakes', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()

    const payload = (await request.json()) as {
      name?: string
      scopeLocationId?: number | null
      scopeCategoryId?: number | null
      notes?: string | null
    }

    if (!payload.name) {
      return badRequest('Audit name is required.')
    }

    const location = payload.scopeLocationId
      ? db.locations.find((item) => item.id === payload.scopeLocationId && item.enabled)
      : null
    if (payload.scopeLocationId && !location) {
      return badRequest('Invalid location scope.')
    }

    const category = payload.scopeCategoryId
      ? db.categories.find((item) => item.id === payload.scopeCategoryId && item.enabled)
      : null
    if (payload.scopeCategoryId && !category) {
      return badRequest('Invalid category scope.')
    }

    const now = new Date().toISOString()
    const audit = {
      id: nextId('stocktakeAudits'),
      name: payload.name,
      scopeLocationId: location?.id ?? null,
      scopeCategoryId: category?.id ?? null,
      scopeLocationName: location?.name ?? null,
      scopeCategoryName: category?.name ?? null,
      status: 'DRAFT' as const,
      createdAt: now,
      startedAt: null,
      finalizedAt: null,
      reportFileId: null,
      discrepancyCount: 0,
      notes: payload.notes ?? null,
    }

    db.stocktakeAudits.push(audit)
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'STOCKTAKE_CREATED',
      entityType: 'STOCKTAKE',
      entityId: String(audit.id),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ name: payload.name }),
    })

    saveDb()
    return HttpResponse.json(audit, { status: 201 })
  }),

  http.get('/api/stocktakes/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const auditId = Number(params.id)
    const audit = db.stocktakeAudits.find((item) => item.id === auditId)
    if (!audit) return notFound('Stocktake audit not found')

    const entries = db.stocktakeEntries
      .filter((item) => item.auditId === auditId)
      .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))

    return HttpResponse.json({ audit, entries })
  }),

  http.post('/api/stocktakes/:id/start', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const auditId = Number(params.id)
    const audit = db.stocktakeAudits.find((item) => item.id === auditId)
    if (!audit) return notFound('Stocktake audit not found')
    if (audit.status === 'FINALIZED') return conflict('Finalized audit is locked', 'AUDIT_LOCKED')

    const now = new Date().toISOString()
    if (audit.status === 'DRAFT') {
      audit.status = 'IN_PROGRESS'
      audit.startedAt = now
    }

    const hasEntries = db.stocktakeEntries.some((item) => item.auditId === auditId)
    if (!hasEntries) {
      const scopedAssets = db.assets.filter((asset) => {
        const locationMatch = audit.scopeLocationId ? asset.locationId === audit.scopeLocationId : true
        const categoryMatch = audit.scopeCategoryId ? asset.categoryId === audit.scopeCategoryId : true
        return asset.isActive && locationMatch && categoryMatch
      })

      for (const asset of scopedAssets) {
        db.stocktakeEntries.push({
          id: nextId('stocktakeEntries'),
          auditId,
          assetId: asset.id,
          inventoryNumber: asset.inventoryNumber,
          assetName: asset.name,
          expectedLocationName: asset.locationName,
          actualLocationName: asset.locationName,
          found: false,
          conditionGrade: null,
          discrepancyType: 'MISSING',
          notes: 'Pending verification',
          recordedAt: now,
        })
      }
    }

    saveDb()
    return HttpResponse.json(audit)
  }),

  http.post('/api/stocktakes/:id/entries', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const auditId = Number(params.id)
    const audit = db.stocktakeAudits.find((item) => item.id === auditId)
    if (!audit) return notFound('Stocktake audit not found')
    if (audit.status === 'FINALIZED') return conflict('Finalized audit is locked', 'AUDIT_LOCKED')

    const payload = (await request.json()) as {
      assetId?: number
      found?: boolean
      conditionGrade?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | null
      actualLocationId?: number | null
      notes?: string | null
    }

    if (!payload.assetId || typeof payload.found !== 'boolean') {
      return badRequest('Asset and found flag are required.')
    }

    const asset = db.assets.find((item) => item.id === payload.assetId)
    if (!asset) return badRequest('Invalid asset for stocktake entry.')

    const location = payload.actualLocationId
      ? db.locations.find((item) => item.id === payload.actualLocationId && item.enabled)
      : null

    const now = new Date().toISOString()
    let entry = db.stocktakeEntries.find((item) => item.auditId === auditId && item.assetId === payload.assetId)
    if (!entry) {
      entry = {
        id: nextId('stocktakeEntries'),
        auditId,
        assetId: asset.id,
        inventoryNumber: asset.inventoryNumber,
        assetName: asset.name,
        expectedLocationName: asset.locationName,
        actualLocationName: null,
        found: false,
        conditionGrade: null,
        discrepancyType: 'MISSING',
        notes: null,
        recordedAt: now,
      }
      db.stocktakeEntries.push(entry)
    }

    entry.found = payload.found
    entry.conditionGrade = payload.conditionGrade ?? null
    entry.actualLocationName = location?.name ?? (payload.found ? asset.locationName : null)
    entry.notes = payload.notes ?? null
    entry.recordedAt = now
    entry.discrepancyType = resolveDiscrepancy(entry.found, entry.expectedLocationName, entry.actualLocationName)

    audit.status = audit.status === 'DRAFT' ? 'IN_PROGRESS' : audit.status
    audit.discrepancyCount = db.stocktakeEntries.filter((item) => item.auditId === audit.id && item.discrepancyType !== 'NONE').length

    saveDb()
    return HttpResponse.json(entry)
  }),

  http.post('/api/stocktakes/:id/reconcile', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const auditId = Number(params.id)
    const audit = db.stocktakeAudits.find((item) => item.id === auditId)
    if (!audit) return notFound('Stocktake audit not found')
    if (audit.status === 'FINALIZED') return conflict('Finalized audit is locked', 'AUDIT_LOCKED')

    const entries = db.stocktakeEntries.filter((item) => item.auditId === auditId)
    const proposedUpdates = entries
      .filter((item) => item.discrepancyType !== 'NONE')
      .map((item) => {
        if (item.discrepancyType === 'MISSING') {
          return {
            assetId: item.assetId,
            inventoryNumber: item.inventoryNumber,
            action: 'MARK_MISSING' as const,
            fromValue: 'IN_STOCK',
            toValue: 'MISSING',
          }
        }
        return {
          assetId: item.assetId,
          inventoryNumber: item.inventoryNumber,
          action: 'MOVE_LOCATION' as const,
          fromValue: item.expectedLocationName,
          toValue: item.actualLocationName,
        }
      })

    audit.status = 'RECONCILING'
    audit.discrepancyCount = proposedUpdates.length
    saveDb()

    return HttpResponse.json({
      discrepancyCount: proposedUpdates.length,
      proposedUpdates,
    })
  }),

  http.post('/api/stocktakes/:id/finalize', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const auditId = Number(params.id)
    const audit = db.stocktakeAudits.find((item) => item.id === auditId)
    if (!audit) return notFound('Stocktake audit not found')
    if (audit.status === 'FINALIZED') return conflict('Finalized audit is locked', 'AUDIT_LOCKED')

    const now = new Date().toISOString()
    const entries = db.stocktakeEntries.filter((item) => item.auditId === auditId)
    let discrepancyCount = 0

    for (const entry of entries) {
      const asset = db.assets.find((item) => item.id === entry.assetId)
      if (!asset) continue

      const oldSnapshot = {
        status: asset.status,
        locationId: asset.locationId,
        locationName: asset.locationName,
        isMissing: asset.isMissing,
      }

      if (!entry.found) {
        asset.isMissing = true
        discrepancyCount += 1
      } else {
        asset.isMissing = false
        asset.lastSeenAuditAt = now
        if (entry.actualLocationName && entry.actualLocationName !== asset.locationName) {
          const location = db.locations.find((item) => item.name === entry.actualLocationName)
          if (location) {
            asset.locationId = location.id
            asset.locationName = location.name
            discrepancyCount += 1
          }
        }
      }

      db.assetEvents.push({
        id: nextId('assetEvents'),
        assetId: asset.id,
        eventType: 'STOCKTAKE_FINALIZED',
        occurredAt: now,
        recordedAt: now,
        actor: 'mock.user',
        source: 'SYSTEM',
        note: entry.found ? 'Verified in stocktake' : 'Marked missing in finalized stocktake',
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
          status: asset.status,
          locationId: asset.locationId,
          locationName: asset.locationName,
          isMissing: asset.isMissing,
        }),
      })
    }

    const reportFileId = nextId('files')
    db.files.push({
      id: reportFileId,
      storageKey: `stocktake/${auditId}-report.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      visibility: 'PRIVATE',
      originalName: `stocktake-audit-${auditId}.xlsx`,
      sizeBytes: 52000,
      createdAt: now,
    })

    audit.status = 'FINALIZED'
    audit.finalizedAt = now
    audit.reportFileId = reportFileId
    audit.discrepancyCount = discrepancyCount

    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'STOCKTAKE_FINALIZED',
      entityType: 'STOCKTAKE',
      entityId: String(audit.id),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ discrepancyCount }),
    })

    saveDb()
    return HttpResponse.json(audit)
  }),
]
