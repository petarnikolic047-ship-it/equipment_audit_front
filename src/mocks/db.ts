import { buildSeedDb } from './seed'
import type { MockDb } from './mockTypes'

const STORAGE_KEY = 'ems-mock-db-v1'

let dbSingleton: MockDb | null = null

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseStoredDb(raw: string | null): MockDb | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<MockDb>
    return {
      assets: parsed.assets ?? [],
      employees: parsed.employees ?? [],
      assignments: parsed.assignments ?? [],
      groups: parsed.groups ?? [],
      categories: parsed.categories ?? [],
      locations: parsed.locations ?? [],
      positions: parsed.positions ?? [],
      returnReasons: parsed.returnReasons ?? [],
      attributes: parsed.attributes ?? [],
      enumOptions: parsed.enumOptions ?? [],
      assetAttributeValues: parsed.assetAttributeValues ?? [],
      files: parsed.files ?? [],
      documents: parsed.documents ?? [],
      importJobs: parsed.importJobs ?? [],
      importRows: parsed.importRows ?? [],
      exportJobs: parsed.exportJobs ?? [],
      auditEvents: parsed.auditEvents ?? [],
      entityHistory: parsed.entityHistory ?? [],
      systemLogs: parsed.systemLogs ?? [],
      assetEvents: parsed.assetEvents ?? [],
      conditionInspections: parsed.conditionInspections ?? [],
      maintenanceTickets: parsed.maintenanceTickets ?? [],
      assetDocuments: parsed.assetDocuments ?? [],
      stocktakeAudits: parsed.stocktakeAudits ?? [],
      stocktakeEntries: parsed.stocktakeEntries ?? [],
      counters: {
        assets: parsed.counters?.assets ?? 0,
        employees: parsed.counters?.employees ?? 0,
        assignments: parsed.counters?.assignments ?? 0,
        files: parsed.counters?.files ?? 0,
        documents: parsed.counters?.documents ?? 0,
        importJobs: parsed.counters?.importJobs ?? 0,
        importRows: parsed.counters?.importRows ?? 0,
        exportJobs: parsed.counters?.exportJobs ?? 0,
        attributes: parsed.counters?.attributes ?? 0,
        enumOptions: parsed.counters?.enumOptions ?? 0,
        assetAttributeValues: parsed.counters?.assetAttributeValues ?? 0,
        auditEvents: parsed.counters?.auditEvents ?? 0,
        entityHistory: parsed.counters?.entityHistory ?? 0,
        systemLogs: parsed.counters?.systemLogs ?? 0,
        groups: parsed.counters?.groups ?? 0,
        categories: parsed.counters?.categories ?? 0,
        locations: parsed.counters?.locations ?? 0,
        positions: parsed.counters?.positions ?? 0,
        returnReasons: parsed.counters?.returnReasons ?? 0,
        assetEvents: parsed.counters?.assetEvents ?? 0,
        conditionInspections: parsed.counters?.conditionInspections ?? 0,
        maintenanceTickets: parsed.counters?.maintenanceTickets ?? 0,
        assetDocuments: parsed.counters?.assetDocuments ?? 0,
        stocktakeAudits: parsed.counters?.stocktakeAudits ?? 0,
        stocktakeEntries: parsed.counters?.stocktakeEntries ?? 0,
      },
    } as MockDb
  } catch {
    return null
  }
}

export function getDb(): MockDb {
  if (dbSingleton) return dbSingleton
  if (canUseStorage()) {
    const parsed = parseStoredDb(window.localStorage.getItem(STORAGE_KEY))
    if (parsed) {
      dbSingleton = parsed
      return parsed
    }
  }
  const seeded = buildSeedDb()
  dbSingleton = seeded
  saveDb()
  return seeded
}

export function saveDb() {
  if (!dbSingleton || !canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dbSingleton))
}

export function resetDb() {
  dbSingleton = buildSeedDb()
  saveDb()
}

export function nextId(counterKey: keyof MockDb['counters']) {
  const db = getDb()
  db.counters[counterKey] += 1
  return db.counters[counterKey]
}

export function paginate<T>(items: T[], pageRaw?: string | null, pageSizeRaw?: string | null) {
  const page = Math.max(1, Number(pageRaw ?? '1'))
  const pageSize = Math.max(1, Number(pageSizeRaw ?? '10'))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total: items.length,
  }
}

export function filterBySearch<T>(items: T[], search: string | null, selector: (item: T) => string[]) {
  if (!search) return items
  const normalized = search.toLowerCase().trim()
  return items.filter((item) => selector(item).some((value) => value.toLowerCase().includes(normalized)))
}

export function requireAuth(request: Request) {
  const auth = request.headers.get('authorization')
  return Boolean(auth?.startsWith('Bearer '))
}
