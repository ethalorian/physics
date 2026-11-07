import { renderChoicePracticePrint } from '@/lib/student-choice-print'

export function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const raw = query.get('options') ?? ''
  if (!/^[1-6](,[1-6]){0,5}$/.test(raw)) return new Response('Choose 1 to 6 different practice pages.', { status: 400 })
  try {
    const html = renderChoicePracticePrint(query.get('packet') ?? '', query.get('edition') ?? '', raw.split(',').map(Number))
    if (!html) return new Response('This page edition is unavailable.', { status: 404 })
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600' } })
  } catch {
    return new Response('Choose 1 to 6 different practice pages.', { status: 400 })
  }
}
