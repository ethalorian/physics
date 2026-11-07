import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { withAuth } from '@/lib/api-auth'
import chapters from '@/data/etf-original/chapters.json'

export const runtime = 'nodejs'

// Both reflowed text and facsimiles are classroom materials. Authenticate before
// serving either representation, including cached-image revalidation requests.
export const GET = withAuth<{ chapter: string }>(async (request, ctx) => {
  const { chapter } = await ctx.params
  const book = chapters.find(c => String(c.number) === chapter)
  if (!book) return new Response(null, {status:404})
  const page = new URL(request.url).searchParams.get('page')
  if (page !== null && (!/^\d+$/.test(page) || Number(page)<book.from || Number(page)>book.to || page!==String(Number(page)))) return new Response(null,{status:404})
  const filename = page === null ? 'chapter.json' : page+'.webp'
  const bytes = await readFile(path.join(process.cwd(),'resources','etf-readers',chapter,filename))
  return new Response(new Uint8Array(bytes), {headers:{
    'Content-Type':page === null ? 'application/json; charset=utf-8' : 'image/webp',
    'Cache-Control':'private, no-cache', 'X-Content-Type-Options':'nosniff',
    'Vary':'Cookie',
  }})
})
