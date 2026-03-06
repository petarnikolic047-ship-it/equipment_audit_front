import { http, HttpResponse } from 'msw'
import { getDb, nextId, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, forbidden, getAuthPrincipal, notFound, unauthorized } from './utils'

function maskJmbg(jmbg: string) {
  return `*****${jmbg.slice(-4)}`
}

function assetStatusHistory(db: ReturnType<typeof getDb>, assetId: number, oldStatus: string, newStatus: string, note: string) {
  const now = new Date().toISOString()
  db.entityHistory.push({
    id: nextId('entityHistory'),
    auditRevisionId: Date.now(),
    changedAt: now,
    entityType: 'ASSET',
    entityPk: String(assetId),
    operation: 'UPDATE',
    oldRowJson: JSON.stringify({ status: oldStatus }),
    newRowJson: JSON.stringify({ status: newStatus }),
  })
  db.auditEvents.push({
    id: nextId('auditEvents'),
    eventType: 'ASSET_STATUS_CHANGED',
    entityType: 'ASSET',
    entityId: String(assetId),
    actor: 'mock.user',
    at: now,
    metadataJson: JSON.stringify({ oldStatus, newStatus, note }),
  })
}

function canEmployeeAccessAsset(db: ReturnType<typeof getDb>, assetId: number, employeeId: number | null) {
  if (!employeeId) return false
  return db.assignments.some((item) => item.assetId === assetId && item.employeeId === employeeId)
}

export const assetOpsHandlers = [
  http.get('/api/assets/:id/events', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const url = new URL(request.url)
    const eventType = url.searchParams.get('eventType')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    let events = db.assetEvents.filter((item) => item.assetId === assetId)
    if (eventType) {
      events = events.filter((item) => item.eventType === eventType)
    }
    if (from) {
      const fromMs = Date.parse(from)
      if (!Number.isNaN(fromMs)) {
        events = events.filter((item) => Date.parse(item.occurredAt) >= fromMs)
      }
    }
    if (to) {
      const toMs = Date.parse(to)
      if (!Number.isNaN(toMs)) {
        events = events.filter((item) => Date.parse(item.occurredAt) <= toMs)
      }
    }
    events.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    return HttpResponse.json(events)
  }),

  http.get('/api/assets/:id/assignments', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const assignments = db.assignments
      .filter((item) => item.assetId === assetId)
      .map((assignment) => {
        const employee = db.employees.find((item) => item.id === assignment.employeeId)
        return {
          ...assignment,
          dueAt: assignment.dueAt ?? null,
          employeeActive: employee?.isActive ?? assignment.employeeActive ?? true,
        }
      })
      .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))

    return HttpResponse.json(assignments)
  }),

  http.get('/api/assets/:id/inspections', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const inspections = db.conditionInspections
      .filter((item) => item.assetId === assetId)
      .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))

    return HttpResponse.json(inspections)
  }),

  http.post('/api/assets/:id/inspections', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')

    const payload = (await request.json()) as {
      conditionGrade?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
      findings?: string | null
      occurredAt?: string
      auditor?: string | null
    }

    if (!payload.conditionGrade || !payload.occurredAt) {
      return badRequest('Condition grade and occurred date are required.')
    }

    const now = new Date().toISOString()
    const inspection = {
      id: nextId('conditionInspections'),
      assetId,
      conditionGrade: payload.conditionGrade,
      findings: payload.findings ?? null,
      auditor: payload.auditor ?? null,
      occurredAt: payload.occurredAt,
      recordedAt: now,
      actor: 'mock.user',
    }

    db.conditionInspections.push(inspection)
    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId,
      eventType: 'INSPECTION_RECORDED',
      occurredAt: payload.occurredAt,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: `Condition set to ${payload.conditionGrade}`,
    })

    saveDb()
    return HttpResponse.json(inspection, { status: 201 })
  }),

  http.get('/api/assets/:id/maintenance', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const tickets = db.maintenanceTickets
      .filter((item) => item.assetId === assetId)
      .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))

    return HttpResponse.json(tickets)
  }),

  http.post('/api/assets/:id/maintenance', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')

    const payload = (await request.json()) as {
      title?: string
      expectedReturnAt?: string | null
      notes?: string | null
    }

    if (!payload.title) {
      return badRequest('Maintenance title is required.')
    }

    const now = new Date().toISOString()
    const ticket = {
      id: nextId('maintenanceTickets'),
      assetId,
      title: payload.title,
      status: 'OPEN' as const,
      openedAt: now,
      expectedReturnAt: payload.expectedReturnAt ?? null,
      closedAt: null,
      downtimeHours: null,
      cost: null,
      reportFileId: null,
      notes: payload.notes ?? null,
      createdBy: 'mock.user',
    }

    db.maintenanceTickets.push(ticket)
    const previousStatus = asset.status
    asset.status = 'UNDER_SERVICE'

    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId,
      eventType: 'MAINTENANCE_OPENED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: payload.title,
    })
    assetStatusHistory(db, assetId, previousStatus, asset.status, 'Maintenance ticket opened')

    saveDb()
    return HttpResponse.json(ticket, { status: 201 })
  }),

  http.post('/api/maintenance/:id/complete', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const ticketId = Number(params.id)
    const ticket = db.maintenanceTickets.find((item) => item.id === ticketId)
    if (!ticket) return notFound('Maintenance ticket not found')
    if (ticket.status === 'CLOSED') return conflict('Maintenance ticket is already closed', 'TICKET_CLOSED')

    const payload = (await request.json()) as {
      cost?: number | null
      downtimeHours?: number | null
      conditionGrade?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | null
      notes?: string | null
      reportFileName?: string | null
    }

    const now = new Date().toISOString()
    ticket.status = 'CLOSED'
    ticket.closedAt = now
    ticket.cost = payload.cost ?? null
    ticket.downtimeHours = payload.downtimeHours ?? null
    ticket.notes = payload.notes ?? ticket.notes

    if (payload.reportFileName) {
      const fileId = nextId('files')
      db.files.push({
        id: fileId,
        storageKey: `maintenance/${ticket.id}-report.pdf`,
        mimeType: 'application/pdf',
        visibility: 'PRIVATE',
        originalName: payload.reportFileName,
        sizeBytes: 44000,
        createdAt: now,
      })
      ticket.reportFileId = fileId
      db.assetDocuments.push({
        id: nextId('assetDocuments'),
        assetId: ticket.assetId,
        docType: 'SERVICE_REPORT',
        fileId,
        assignmentId: null,
        createdAt: now,
      })
    }

    const asset = db.assets.find((item) => item.id === ticket.assetId)
    if (asset) {
      const previousStatus = asset.status
      asset.status = 'IN_STOCK'
      asset.isMissing = false
      asset.lastSeenAuditAt = now
      assetStatusHistory(db, asset.id, previousStatus, asset.status, 'Maintenance completed')
    }

    if (payload.conditionGrade && asset) {
      db.conditionInspections.push({
        id: nextId('conditionInspections'),
        assetId: asset.id,
        conditionGrade: payload.conditionGrade,
        findings: payload.notes ?? 'Condition updated after maintenance completion',
        auditor: null,
        occurredAt: now,
        recordedAt: now,
        actor: 'mock.user',
      })
    }

    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId: ticket.assetId,
      eventType: 'MAINTENANCE_COMPLETED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: payload.notes ?? null,
    })

    saveDb()
    return HttpResponse.json(ticket)
  }),

  http.get('/api/assets/:id/documents', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const docs = db.assetDocuments
      .filter((item) => item.assetId === assetId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

    return HttpResponse.json(docs)
  }),

  http.get('/api/assets/:id/audit-trail', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assetId = Number(params.id)
    const asset = db.assets.find((item) => item.id === assetId)
    if (!asset) return notFound('Asset not found')
    if (principal.role === 'EMPLOYEE' && !canEmployeeAccessAsset(db, assetId, principal.employeeId)) {
      return forbidden('ASSET_EDIT')
    }

    const events = db.assetEvents.filter((item) => item.assetId === assetId)
    const assignments = db.assignments.filter((item) => item.assetId === assetId)
    const auditEvents = db.auditEvents.filter(
      (item) =>
        (item.entityType === 'ASSET' && item.entityId === String(assetId)) || item.metadataJson.includes(`"assetId":${assetId}`),
    )
    const history = db.entityHistory.filter((item) => item.entityType === 'ASSET' && item.entityPk === String(assetId))

    return HttpResponse.json({
      events,
      assignments,
      auditEvents,
      history,
    })
  }),

  http.post('/api/assets/transfer', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const payload = (await request.json()) as {
      assetIds?: number[]
      fromEmployeeId?: number | null
      toEmployeeId?: number | null
      fromLocationId?: number | null
      toLocationId?: number | null
      confirmationChecked?: boolean
      notes?: string | null
      evidenceFileName?: string | null
    }

    if (!payload.assetIds?.length) {
      return badRequest('Select at least one asset for transfer.')
    }
    if (!payload.confirmationChecked) {
      return badRequest('Transfer confirmation is required.')
    }
    if (!payload.notes || !payload.notes.trim()) {
      return badRequest('Transfer note/reason is required for custody override.')
    }
    if (!payload.toEmployeeId && !payload.toLocationId) {
      return badRequest('Target employee or target location must be provided.')
    }

    const toEmployee = payload.toEmployeeId
      ? db.employees.find((item) => item.id === payload.toEmployeeId && item.isActive)
      : null
    if (payload.toEmployeeId && !toEmployee) {
      return badRequest('Target employee is invalid or inactive.')
    }

    const toLocation = payload.toLocationId
      ? db.locations.find((item) => item.id === payload.toLocationId && item.enabled)
      : null
    if (payload.toLocationId && !toLocation) {
      return badRequest('Target location is invalid.')
    }

    const now = new Date().toISOString()
    const transferId = nextId('assetEvents')
    let documentFileId: number | null = null

    if (payload.evidenceFileName) {
      documentFileId = nextId('files')
      db.files.push({
        id: documentFileId,
        storageKey: `transfer/${transferId}.pdf`,
        mimeType: 'application/pdf',
        visibility: 'PRIVATE',
        originalName: payload.evidenceFileName,
        sizeBytes: 38000,
        createdAt: now,
      })
    }

    for (const assetId of payload.assetIds) {
      const asset = db.assets.find((item) => item.id === assetId && item.isActive)
      if (!asset) return badRequest(`Asset ${assetId} is invalid.`)

      if (toLocation) {
        asset.locationId = toLocation.id
        asset.locationName = toLocation.name
      }

      const activeAssignment = db.assignments.find((item) => item.assetId === asset.id && !item.returnedAt)
      if (activeAssignment && toEmployee) {
        activeAssignment.returnedAt = now
        activeAssignment.returnReasonId = null
        activeAssignment.returnReasonName = 'Custody transfer'
        activeAssignment.notes = payload.notes ?? activeAssignment.notes

        const fileId = nextId('files')
        const assignmentId = nextId('assignments')
        db.files.push({
          id: fileId,
          storageKey: `revers/${assignmentId}.pdf`,
          mimeType: 'application/pdf',
          visibility: 'PRIVATE',
          originalName: `revers-transfer-${assignmentId}.pdf`,
          sizeBytes: 83500,
          createdAt: now,
        })

        db.assignments.push({
          id: assignmentId,
          assetId: asset.id,
          assetName: asset.name,
          assetInventoryNumber: asset.inventoryNumber,
          employeeId: toEmployee.id,
          employeeFullName: `${toEmployee.firstName} ${toEmployee.lastName}`,
          employeeJmbgMasked: maskJmbg(toEmployee.jmbg),
          takenAt: now,
          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
          returnedAt: null,
          returnReasonId: null,
          returnReasonName: null,
          notes: payload.notes ?? null,
          reversFileId: fileId,
          employeeActive: true,
        })

        db.documents.push({
          id: nextId('documents'),
          docType: 'REVERS',
          assignmentId,
          fileId,
          createdAt: now,
        })
        db.assetDocuments.push({
          id: nextId('assetDocuments'),
          assetId: asset.id,
          docType: 'REVERS',
          fileId,
          assignmentId,
          createdAt: now,
        })

        asset.status = 'ASSIGNED'
      } else if (!toEmployee) {
        asset.status = 'IN_STOCK'
      }

      if (documentFileId) {
        db.assetDocuments.push({
          id: nextId('assetDocuments'),
          assetId: asset.id,
          docType: 'TRANSFER_CONFIRMATION',
          fileId: documentFileId,
          assignmentId: null,
          createdAt: now,
        })
      }

      db.assetEvents.push({
        id: nextId('assetEvents'),
        assetId: asset.id,
        eventType: 'CUSTODY_TRANSFERRED',
        occurredAt: now,
        recordedAt: now,
        actor: 'mock.user',
        source: 'MANUAL_OVERRIDE',
        note: payload.notes ?? 'Transfer operation completed',
      })
      db.auditEvents.push({
        id: nextId('auditEvents'),
        eventType: 'ASSET_TRANSFERRED',
        entityType: 'ASSET',
        entityId: String(asset.id),
        actor: 'mock.user',
        at: now,
        metadataJson: JSON.stringify({
          fromEmployeeId: payload.fromEmployeeId ?? null,
          toEmployeeId: payload.toEmployeeId ?? null,
          fromLocationId: payload.fromLocationId ?? null,
          toLocationId: payload.toLocationId ?? null,
        }),
      })
    }

    saveDb()
    return HttpResponse.json(
      {
        transferId,
        occurredAt: now,
        documentFileId,
        message: 'Custody transfer completed.',
      },
      { status: 201 },
    )
  }),

  http.get('/api/me/equipment', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    const requestedUserId = Number(url.searchParams.get('userId') || 0)
    const userId =
      principal.role === 'ADMIN'
        ? requestedUserId || principal.employeeId || 1
        : principal.employeeId || requestedUserId || 1

    const assignments = db.assignments
      .filter((item) => item.employeeId === userId)
      .map((item) => ({
        assignmentId: item.id,
        assetId: item.assetId,
        inventoryNumber: item.assetInventoryNumber,
        assetName: item.assetName,
        status: item.returnedAt ? 'RETURNED' : 'ASSIGNED',
        takenAt: item.takenAt,
        returnedAt: item.returnedAt,
        reversFileId: item.reversFileId,
      }))
      .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt))

    return HttpResponse.json({
      current: assignments.filter((item) => item.returnedAt === null),
      history: assignments,
    })
  }),
]
