export interface StoredFile {
  id: number
  storageKey: string
  mimeType: string
  visibility: 'PRIVATE' | 'PUBLIC'
  originalName: string
  sizeBytes: number
  createdAt: string
}

export interface DocumentRecord {
  id: number
  docType: 'REVERS'
  assignmentId: number
  fileId: number
  createdAt: string
}
