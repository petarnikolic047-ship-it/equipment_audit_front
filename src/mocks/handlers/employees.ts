import { http, HttpResponse } from 'msw'
import { filterBySearch, getDb, nextId, paginate, saveDb } from '../db'
import { badRequest, conflict, ensureAuth, forbidden, getAuthPrincipal, notFound, unauthorized } from './utils'

export const employeeHandlers = [
  http.get('/api/employees', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    let employees = [...db.employees]
    employees = filterBySearch(employees, url.searchParams.get('search'), (item) => [item.firstName, item.lastName, item.jmbg, item.phone])
    const positionId = url.searchParams.get('positionId')
    if (positionId) employees = employees.filter((item) => item.positionId === Number(positionId))
    const active = url.searchParams.get('active')
    if (active) employees = employees.filter((item) => item.isActive === (active === 'true'))
    const hasAssets = url.searchParams.get('hasAssets')
    const withFlags = employees.map((employee) => ({
      ...employee,
      hasActiveAssignments: db.assignments.some((item) => item.employeeId === employee.id && !item.returnedAt),
    }))
    const filtered = hasAssets
      ? withFlags.filter((item) => item.hasActiveAssignments === (hasAssets === 'true'))
      : withFlags
    const scoped = principal.role === 'EMPLOYEE'
      ? filtered.filter((item) => item.id === principal.employeeId)
      : filtered
    return HttpResponse.json(paginate(scoped, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/employees/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    const db = getDb()
    const employee = db.employees.find((item) => item.id === Number(params.id))
    if (!employee) return notFound('Employee not found')
    if (principal.role === 'EMPLOYEE' && employee.id !== principal.employeeId) {
      return forbidden('EMPLOYEE_EDIT')
    }
    return HttpResponse.json({
      ...employee,
      hasActiveAssignments: db.assignments.some((item) => item.employeeId === employee.id && !item.returnedAt),
    })
  }),
  http.post('/api/employees', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('EMPLOYEE_EDIT')
    const db = getDb()
    const payload = (await request.json()) as {
      firstName?: string
      lastName?: string
      jmbg?: string
      phone?: string
      address?: string | null
      positionId?: number
    }
    if (!payload.firstName || !payload.lastName || !payload.jmbg || !payload.phone || !payload.positionId) {
      return badRequest('Missing required fields.')
    }
    const position = db.positions.find((item) => item.id === payload.positionId && item.enabled)
    if (!position) return badRequest('Invalid position.')
    if (db.employees.some((item) => item.jmbg === payload.jmbg)) {
      return conflict('Duplicate JMBG', 'DUPLICATE_JMBG')
    }
    const employee = {
      id: nextId('employees'),
      firstName: payload.firstName,
      lastName: payload.lastName,
      jmbg: payload.jmbg,
      phone: payload.phone,
      address: payload.address ?? null,
      positionId: position.id,
      positionName: position.name,
      isActive: true,
      deactivatedAt: null,
    }
    db.employees.push(employee)
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: String(employee.id),
      actor: 'mock.user',
      at: new Date().toISOString(),
      metadataJson: JSON.stringify({ firstName: employee.firstName, lastName: employee.lastName }),
    })
    saveDb()
    return HttpResponse.json(employee, { status: 201 })
  }),
  http.put('/api/employees/:id', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (!['ADMIN', 'MVP', 'MANAGER', 'OWNER'].includes(principal.role)) return forbidden('EMPLOYEE_EDIT')
    const db = getDb()
    const id = Number(params.id)
    const employee = db.employees.find((item) => item.id === id)
    if (!employee) return notFound('Employee not found')
    const payload = (await request.json()) as {
      firstName?: string
      lastName?: string
      jmbg?: string
      phone?: string
      address?: string | null
      positionId?: number
    }
    const position = db.positions.find((item) => item.id === payload.positionId && item.enabled)
    if (!position) return badRequest('Invalid position')
    if (payload.jmbg && db.employees.some((item) => item.jmbg === payload.jmbg && item.id !== id)) {
      return conflict('Duplicate JMBG', 'DUPLICATE_JMBG')
    }
    const oldSnapshot = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone,
      positionId: employee.positionId,
    }
    employee.firstName = payload.firstName ?? employee.firstName
    employee.lastName = payload.lastName ?? employee.lastName
    employee.jmbg = payload.jmbg ?? employee.jmbg
    employee.phone = payload.phone ?? employee.phone
    employee.address = payload.address ?? employee.address
    employee.positionId = position.id
    employee.positionName = position.name
    const now = new Date().toISOString()
    db.entityHistory.push({
      id: nextId('entityHistory'),
      auditRevisionId: Date.now(),
      changedAt: now,
      entityType: 'EMPLOYEE',
      entityPk: String(id),
      operation: 'UPDATE',
      oldRowJson: JSON.stringify(oldSnapshot),
      newRowJson: JSON.stringify({
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        positionId: employee.positionId,
      }),
    })
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: String(id),
      actor: 'mock.user',
      at: now,
      metadataJson: JSON.stringify({ changed: ['profile'] }),
    })
    saveDb()
    return HttpResponse.json(employee)
  }),
  http.post('/api/employees/:id/deactivate', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const principal = getAuthPrincipal(request)
    if (!principal) return unauthorized()
    if (principal.role !== 'ADMIN') return forbidden('EMPLOYEE_EDIT')
    const db = getDb()
    const id = Number(params.id)
    const employee = db.employees.find((item) => item.id === id)
    if (!employee) return notFound('Employee not found')
    const hasActiveAssignment = db.assignments.some((item) => item.employeeId === id && !item.returnedAt)
    if (hasActiveAssignment) {
      return conflict('Employee has active assignments', 'EMPLOYEE_HAS_ACTIVE_ASSIGNMENTS')
    }
    employee.isActive = false
    employee.deactivatedAt = new Date().toISOString()
    db.assignments = db.assignments.map((assignment) =>
      assignment.employeeId === id ? { ...assignment, employeeActive: false } : assignment,
    )
    db.auditEvents.push({
      id: nextId('auditEvents'),
      eventType: 'EMPLOYEE_DEACTIVATED',
      entityType: 'EMPLOYEE',
      entityId: String(id),
      actor: 'mock.user',
      at: employee.deactivatedAt,
      metadataJson: JSON.stringify({ reason: 'manual' }),
    })
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
