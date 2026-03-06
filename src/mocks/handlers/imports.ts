import { http, HttpResponse } from 'msw'
import { getDb, nextId, paginate, saveDb } from '../db'
import { badRequest, ensureAuth, notFound, unauthorized } from './utils'

function evolveImportJob(id: number) {
  const db = getDb()
  const job = db.importJobs.find((item) => item.id === id)
  if (!job) return null
  if (['COMPLETED', 'FAILED', 'COMPLETED_WITH_ERRORS'].includes(job.status)) return job
  job.pollCount += 1
  if (job.status === 'QUEUED' && job.pollCount >= 1) {
    job.status = 'VALIDATING'
    job.startedAt = new Date().toISOString()
  } else if (job.status === 'VALIDATING' && job.pollCount >= 2) {
    job.status = 'READY_TO_APPLY'
  } else if (job.status === 'APPLYING' && job.pollCount >= 3) {
    job.status = job.summaryErrors > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED'
    job.finishedAt = new Date().toISOString()
  }
  saveDb()
  return job
}

export const importsHandlers = [
  http.get('/api/imports', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const url = new URL(request.url)
    return HttpResponse.json(paginate(db.importJobs, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/imports/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const jobId = Number(params.id)
    const job = evolveImportJob(jobId)
    if (!job) return notFound('Import job not found')
    return HttpResponse.json(job)
  }),
  http.get('/api/imports/:id/rows', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const jobId = Number(params.id)
    const onlyErrors = new URL(request.url).searchParams.get('onlyErrors') === 'true'
    const rows = db.importRows.filter((item) => item.importJobId === jobId && (!onlyErrors || Boolean(item.errorCode)))
    return HttpResponse.json(rows)
  }),
  http.post('/api/imports', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const form = await request.formData()
    const importType = String(form.get('importType') ?? '').trim()
    const file = form.get('file')
    if (!importType || !(file instanceof File)) {
      return badRequest('File and importType are required.')
    }
    const fileId = nextId('files')
    db.files.push({
      id: fileId,
      storageKey: `imports/${file.name}-${Date.now()}`,
      mimeType: file.type || 'application/octet-stream',
      visibility: 'PRIVATE',
      originalName: file.name,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    })
    const jobId = nextId('importJobs')
    db.importJobs.unshift({
      id: jobId,
      importType,
      status: 'QUEUED',
      createdBy: 'John Doe',
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      sourceFileId: fileId,
      errorReportFileId: null,
      summaryCreated: 0,
      summaryUpdated: 0,
      summarySkipped: 0,
      summaryErrors: 0,
      pollCount: 0,
    })
    saveDb()
    return HttpResponse.json({ importJobId: jobId, storedFileId: fileId }, { status: 201 })
  }),
  http.post('/api/imports/:id/preview', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const job = db.importJobs.find((item) => item.id === Number(params.id))
    if (!job) return notFound('Import job not found')
    job.status = 'READY_TO_APPLY'
    job.summaryCreated = 12
    job.summaryUpdated = 3
    job.summarySkipped = 2
    job.summaryErrors = 1
    db.importRows = db.importRows.filter((item) => item.importJobId !== job.id)
    db.importRows.push(
      {
        id: nextId('importRows'),
        importJobId: job.id,
        rowNumber: 1,
        action: 'CREATE',
        errorCode: null,
        message: 'Will create record',
        rawRowJson: '{"sample":"row-1"}',
      },
      {
        id: nextId('importRows'),
        importJobId: job.id,
        rowNumber: 2,
        action: 'SKIP',
        errorCode: 'DUPLICATE_KEY',
        message: 'Duplicate record',
        rawRowJson: '{"sample":"row-2"}',
      },
    )
    saveDb()
    return HttpResponse.json({
      summary: {
        summaryCreated: job.summaryCreated,
        summaryUpdated: job.summaryUpdated,
        summarySkipped: job.summarySkipped,
        summaryErrors: job.summaryErrors,
      },
      sampleRows: db.importRows.filter((item) => item.importJobId === job.id).slice(0, 10),
    })
  }),
  http.post('/api/imports/:id/apply', async ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { idempotencyKey?: string }
    if (!payload.idempotencyKey) return badRequest('Idempotency key is required.')
    const job = db.importJobs.find((item) => item.id === Number(params.id))
    if (!job) return notFound('Import job not found')
    job.status = 'APPLYING'
    job.pollCount = 0
    if (job.summaryErrors > 0) {
      const errorFileId = nextId('files')
      db.files.push({
        id: errorFileId,
        storageKey: `imports/error-report-${job.id}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        visibility: 'PRIVATE',
        originalName: `import-errors-${job.id}.xlsx`,
        sizeBytes: 6500,
        createdAt: new Date().toISOString(),
      })
      job.errorReportFileId = errorFileId
    }
    saveDb()
    return HttpResponse.json({ accepted: true }, { status: 202 })
  }),
]
