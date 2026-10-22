export const LESSON_ARTIFACT_BUCKET = 'student-reflections'
export const MAX_ARTIFACT_BYTES = 4_000_000
export const ARTIFACT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export interface ArtifactResponse { attachmentId?: string; text: string }
export function isArtifactResponseComplete(value: unknown): boolean {
  const v = value as ArtifactResponse | null
  return !!v && typeof v.attachmentId === 'string' && ARTIFACT_ID.test(v.attachmentId) && typeof v.text === 'string' && !!v.text.trim()
}
/** File extensions and browser MIME values are not trusted. */
export function artifactFileType(bytes: Uint8Array): { type: string; ext: string } | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b)
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { type: 'image/png', ext: 'png' }
  if (starts([0xff, 0xd8, 0xff])) return { type: 'image/jpeg', ext: 'jpg' }
  if (starts([0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return { type: 'application/pdf', ext: 'pdf' }
  return null
}
