import { http, HttpResponse } from 'msw'
import { getDb, nextId, paginate, saveDb } from '../db'
import { badRequest, ensureAuth, notFound, unauthorized } from './utils'

function evolveExportJob(id: number) {
  const db = getDb()
  const job = db.exportJobs.find((item) => item.id === id)
  if (!job) return null
  if (['COMPLETED', 'FAILED'].includes(job.status)) return job
  job.pollCount += 1
  if (job.status === 'QUEUED' && job.pollCount >= 1) {
    job.status = 'RUNNING'
    job.startedAt = new Date().toISOString()
  } else if (job.status === 'RUNNING' && job.pollCount >= 2) {
    job.status = 'COMPLETED'
    job.finishedAt = new Date().toISOString()
    if (!job.outputFileId) {
      const fileId = nextId('files')
      db.files.push({
        id: fileId,
        storageKey: `exports/job-${job.id}.${job.format.toLowerCase()}`,
        mimeType:
          job.format === 'PDF'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        visibility: 'PRIVATE',
        originalName: `export-${job.id}.${job.format.toLowerCase()}`,
        sizeBytes: 45000,
        createdAt: new Date().toISOString(),
      })
      job.outputFileId = fileId
    }
  }
  saveDb()
  return job
}

export const exportsHandlers = [
  http.get('/api/exports', ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const url = new URL(request.url)
    return HttpResponse.json(paginate(getDb().exportJobs, url.searchParams.get('page'), url.searchParams.get('pageSize')))
  }),
  http.get('/api/exports/:id', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const job = evolveExportJob(Number(params.id))
    if (!job) return notFound('Export job not found')
    return HttpResponse.json(job)
  }),
  http.post('/api/exports', async ({ request }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const payload = (await request.json()) as { type?: string; format?: string; filterJson?: string }
    if (!payload.type || !payload.format || !payload.filterJson) {
      return badRequest('Type, format and filterJson are required.')
    }
    const jobId = nextId('exportJobs')
    db.exportJobs.unshift({
      id: jobId,
      type: payload.type,
      format: payload.format as 'XLSX' | 'CSV' | 'PDF',
      status: 'QUEUED',
      filterJson: payload.filterJson,
      createdBy: 'John Doe',
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      outputFileId: null,
      errorMessage: null,
      pollCount: 0,
    })
    saveDb()
    return HttpResponse.json({ exportJobId: jobId }, { status: 202 })
  }),
  http.post('/api/exports/:id/cancel', ({ request, params }) => {
    if (!ensureAuth(request)) return unauthorized()
    const db = getDb()
    const job = db.exportJobs.find((item) => item.id === Number(params.id))
    if (!job) return notFound('Export job not found')
    job.status = 'FAILED'
    job.finishedAt = new Date().toISOString()
    job.errorMessage = 'Canceled by user'
    saveDb()
    return HttpResponse.json({ ok: true })
  }),
]
