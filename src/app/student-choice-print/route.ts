import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, PrintScaling } from 'pdf-lib'
import manifest from '@/data/student-choice-practice-pdfs.json'
import { validateChoiceSelection } from '@/lib/student-choice'

const files: Record<string, string> = manifest
const invalid = () => new Response('Choose 1 to 10 different practice pages.', { status: 400 })

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const raw = query.get('options') ?? ''
  if (!/^(?:[1-9]|10)(?:,(?:[1-9]|10)){0,9}$/.test(raw)) return invalid()
  const requested = raw.split(',').map(Number)
  let options: number[]
  try {
    options = validateChoiceSelection({ option_numbers: requested, version: 0 }, requested.length).option_numbers
  } catch {
    return invalid()
  }

  const packet = query.get('packet')
  const key = packet + '@' + query.get('edition')
  if (!Object.prototype.hasOwnProperty.call(files, key)) return new Response('This page edition is unavailable.', { status: 404 })

  const source = await readFile(path.join(process.cwd(), 'public/student-choice-pages/practice-pdfs', files[key]))
  let bytes: Uint8Array = source
  const original = await PDFDocument.load(source)
  if (options.some(n => n > original.getPageCount())) return invalid()
  if (options.length < original.getPageCount()) {
    const selection = await PDFDocument.create()
    const sheets = await selection.copyPages(original, options.map(n => n - 1))
    for (const sheet of sheets) selection.addPage(sheet)
    selection.setTitle(packet + ' · Practice options ' + options.join(', '))
    selection.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None)
    bytes = await selection.save()
  }

  const disposition = query.get('download') === '1' ? 'attachment' : 'inline'
  return new Response(new Uint8Array(bytes).buffer, { headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': disposition + '; filename="' + packet + '-options-' + options.join('-') + '.pdf"',
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  } })
}
