import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// POST /api/media/upload  (multipart/form-data, field "file")
// Teacher/admin uploads a PDF or image to the public `lesson-media` bucket and
// gets back a public URL to drop into a figure / concept_exercise block. Upload
// runs through supabaseAdmin (service role) so no per-user storage policy is
// needed; the bucket is public-read so the returned URL works in the viewer.

const BUCKET = 'lesson-media'
const MAX_BYTES = 25 * 1024 * 1024 // mirrors the bucket's 25MB limit
const ALLOWED = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif',
])
const EXT: Record<string, string> = {
  'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg',
  'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif',
}

function slugify(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase()
  return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file'
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user?.email)
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can upload media' }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File is larger than 25 MB' }, { status: 413 })
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 415 })

    const folder = form.get('folder')
    const sub = typeof folder === 'string' && /^[a-z0-9/_-]{1,40}$/i.test(folder) ? `${folder.replace(/^\/+|\/+$/g, '')}/` : ''
    const ext = EXT[file.type] ?? 'bin'
    const path = `${sub}${slugify(file.name)}-${Date.now().toString(36)}.${ext}`

    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      console.error('media upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 502 })
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path, contentType: file.type, size: file.size })
  } catch (err) {
    console.error('Error in POST /api/media/upload:', err)
    return NextResponse.json({ error: 'Could not upload the file' }, { status: 500 })
  }
}
