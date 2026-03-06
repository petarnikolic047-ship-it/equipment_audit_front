import { http, HttpResponse } from 'msw'
import { filterBySearch, getDb, nextId, paginate, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, forbidden, getAuthPrincipal, notFound, unauthorized } from './utils'

function maskJmbg(jmbg: string) {
  return `*****${jmbg.slice(-4)}`
}

export const assignmentHandlers = [
  http.get('/api/assignments', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    let assignments = db.assignments.map((assignment) => {
      const employee = db.employees.find((item) => item.id === assignment.employeeId)
      return {
        ...assignment,
        dueAt: assignment.dueAt ?? null,
        employeeActive: employee?.isActive ?? assignment.employeeActive ?? true,
      }
    })
    assignments = filterBySearch(assignments, url.searchParams.get('search'), (item) => [
      item.assetInventoryNumber,
      item.assetName,
      item.employeeFullName,
    ])
    const activeOnly = url.searchParams.get('activeOnly')
    if (activeOnly === 'true') assignments = assignments.filter((item) => !item.returnedAt)
    const employeeId = url.searchParams.get('employeeId')
    if (employeeId) assignments = assignments.filter((item) => item.employeeId === Number(employeeId))
    const assetId = url.searchParams.get('assetId')
    if (assetId) assignments = assignments.filter((item) => item.assetId === Number(assetId))
    const overdueReturn = url.searchParams.get('overdueReturn')
    if (overdueReturn === 'true') {
      const now = Date.now()
      assignments = assignments.filter((item) => !item.returnedAt && item.dueAt && Date.parse(item.dueAt) < now)
    }
    const employeeDeactivatedWithActive = url.searchParams.get('employeeDeactivatedWithActive')
    if (employeeDeactivatedWithActive === 'true') {
      assignments = assignments.filter((item) => !item.returnedAt && !item.employeeActive)
    }
    const takenFrom = url.searchParams.get('takenFrom')
    if (takenFrom) {
      const fromMs = Date.parse(takenFrom)
      if (!Number.isNaN(fromMs)) {
        assignments = assignments.filter((item) => Date.parse(item.takenAt) >= fromMs)
      }
    }
    const takenTo = url.searchParams.get('takenTo')
    if (takenTo) {
      const toMs = Date.parse(takenTo)
      if (!Number.isNaN(toMs)) {
        assignments = assignments.filter((item) => Date.parse(item.takenAt) <= toMs)
      }
    }
    if (principal.role === 'EMPLOYEE') {
      assignments = assignments.filter((item) => item.employeeId === principal.employeeId)
    }
    return HttpResponse.json(paginate(assignments, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/assignments/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const assignment = db.assignments.find((item) => item.id === Number(params.id))
    if (!assignment) return notFound('Assignment not found')
    if (principal.role === 'EMPLOYEE' && assignment.employeeId !== principal.employeeId) {
      return forbidden('ASSET_EDIT')
    }
    const employee = db.employees.find((item) => item.id === assignment.employeeId)
    return HttpResponse.json({
      ...assignment,
      dueAt: assignment.dueAt ?? null,
      employeeActive: employee?.isActive ?? assignment.employeeActive ?? true,
    })
  }),
  http.post('/api/assignments', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const payload = (await request.json()) as { assetId?: number; employeeId?: number; notes?: string | null }
    if (!payload.assetId || !payload.employeeId) {
      return badRequest('Asset and employee are required.')
    }
    const asset = db.assets.find((item) => item.id === payload.assetId && item.isActive)
    if (!asset) return badRequest('Asset not found.')
    const employee = db.employees.find((item) => item.id === payload.employeeId && item.isActive)
    if (!employee) return badRequest('Employee not found.')
    const existing = db.assignments.find((item) => item.assetId === payload.assetId && !item.returnedAt)
    if (existing) return conflict('Asset already assigned', 'ASSET_ALREADY_ASSIGNED')

    const assignmentId = nextId('assignments')
    const fileId = nextId('files')
    const documentId = nextId('documents')
    db.files.push({
      id: fileId,
      storageKey: `revers/${assignmentId}.pdf`,
      mimeType: 'application/pdf',
      visibility: 'PRIVATE',
      originalName: `revers-${assignmentId}.pdf`,
      sizeBytes: 84500,
      createdAt: new Date().toISOString(),
    })
    db.documents.push({
      id: documentId,
      docType: 'REVERS',
      assignmentId,
      fileId,
      createdAt: new Date().toISOString(),
    })
    const fullName = `${employee.firstName} ${employee.lastName}`
    db.assignments.push({
      id: assignmentId,
      assetId: asset.id,
      assetName: asset.name,
      assetInventoryNumber: asset.inventoryNumber,
      employeeId: employee.id,
      employeeFullName: fullName,
      employeeJmbgMasked: maskJmbg(employee.jmbg),
      takenAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      returnedAt: null,
      returnReasonId: null,
      returnReasonName: null,
      notes: payload.notes ?? null,
      reversFileId: fileId,
      employeeActive: employee.isActive,
    })
    const previousStatus = asset.status
    asset.status = 'ASSIGNED'
    asset.isMissing = false

    db.assetDocuments.push({
      id: nextId('assetDocuments'),
      assetId: asset.id,
      docType: 'REVERS',
      fileId,
      assignmentId,
      createdAt: new Date().toISOString(),
    })

    const now = new Date().toISOString()
    db.assetEvents.push({
      id: nextId('assetEvents'),
      assetId: asset.id,
      eventType: 'ASSIGNMENT_CREATED',
      occurredAt: now,
      recordedAt: now,
      actor: 'mock.user',
      source: 'BUSINESS',
      note: `Assigned to ${fullName}`,
    })
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'ASSIGNMENT_CREATED',
      entityType: 'ASSIGNMENT',
      entityId: String(assignmentId),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ assetId: asset.id, employeeId: employee.id }),
    })
    db.entityHistory.push({
      id: nextId('entityHistory'),
      auditRevisionId: Date.now(),
      changedAt: now,
      entityType: 'ASSET',
      entityPk: String(asset.id),
      operation: 'UPDATE',
      oldRowJson: JSON.stringify({ status: previousStatus }),
      newRowJson: JSON.stringify({ status: asset.status }),
    })
    saveDb()
    return HttpResponse.json(
      {
        assignmentId,
        documentId,
        fileId,
        downloadEndpoint: `/api/files/${fileId}/download`,
      },
      { status: 201 },
    )
  }),
  http.post('/api/assignments/:id/return', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('ASSET_EDIT')
    const db = getDb()
    const assignment = db.assignments.find((item) => item.id === Number(params.id))
    if (!assignment) return notFound('Assignment not found')
    if (assignment.returnedAt) {
      return conflict('Already returned', 'ALREADY_RETURNED')
    }
    const payload = (await request.json()) as { returnReasonId?: number; notes?: string | null }
    if (!payload.returnReasonId) return badRequest('Return reason is required.')
    const reason = db.returnReasons.find((item) => item.id === payload.returnReasonId && item.enabled)
    if (!reason) return badRequest('Invalid return reason.')
    assignment.returnedAt = new Date().toISOString()
    assignment.returnReasonId = reason.id
    assignment.returnReasonName = reason.reasonText
    assignment.notes = payload.notes ?? null
    assignment.employeeActive = db.employees.find((item) => item.id === assignment.employeeId)?.isActive ?? assignment.employeeActive
    const asset = db.assets.find((item) => item.id === assignment.assetId)
    if (asset) {
      const previousStatus = asset.status
      asset.status = reason.isMalfunction ? 'UNDER_SERVICE' : 'IN_STOCK'
      asset.lastSeenAuditAt = new Date().toISOString()
      asset.isMissing = false
      const now = new Date().toISOString()
      db.assetEvents.push({
        id: nextId('assetEvents'),
        assetId: asset.id,
        eventType: 'ASSIGNMENT_RETURNED',
        occurredAt: now,
        recordedAt: now,
        actor: 'mock.user',
        source: 'BUSINESS',
        note: `Return reason: ${reason.reasonText}`,
      })
      db.auditEvents.push({
        id: nextId('auditEvents'),
        eventType: 'ASSIGNMENT_RETURNED',
        entityType: 'ASSIGNMENT',
        entityId: String(assignment.id),
        actor: 'mock.user',
        at: now,
        metadataJson: JSON.stringify({ reason: reason.code }),
      })
      db.entityHistory.push({
        id: nextId('entityHistory'),
        auditRevisionId: Date.now(),
        changedAt: now,
        entityType: 'ASSET',
        entityPk: String(asset.id),
        operation: 'UPDATE',
        oldRowJson: JSON.stringify({ status: previousStatus }),
        newRowJson: JSON.stringify({ status: asset.status }),
      })
    }
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
