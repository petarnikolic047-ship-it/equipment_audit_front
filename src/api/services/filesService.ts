import { getParsed } from '../client'
import { z } from 'zod'

const fileDownloadSchema = z.object({
  url: z.string(),
})

export async function getDownloadLink(fileId: number): Promise<string> {
  const result = await getParsed(`/files/${fileId}/download`, fileDownloadSchema)
  return result.url
}
