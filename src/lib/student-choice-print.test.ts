import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PDFArray, PDFDocument, PDFStream, type PDFPage } from 'pdf-lib'
import manifest from '@/data/student-choice-practice-pdfs.json'
import catalog from '@/data/student-choice-binder.json'
import { renderChoicePracticePrint } from './student-choice-print'
import { GET } from '@/app/student-choice-print/route'
import { choicePracticePrintPath } from './student-choice'

test('all 63 subsets of every pinned edition contain only exact original sections in option order', () => {
  for (const packet of catalog) {
    const originals = packet.options.map(o => fs.readFileSync('public' + o.path, 'utf8').match(/<section\b[\s\S]*?<\/section>/)![0])
    for (let mask = 1; mask < 64; mask++) {
      const selected = originals.flatMap((_, i) => mask & (1 << i) ? [i + 1] : [])
      const html = renderChoicePracticePrint(packet.key, packet.version, [...selected].reverse())!
      assert.deepEqual(html.match(/<section\b[\s\S]*?<\/section>/g), selected.map(n => originals[n - 1]))
      assert.match(html, /<base href="\/student-choice-pages\//)
    }
  }
})
// Compare the printed content streams so a packet of repeated first pages fails.
function pageContent(page: PDFPage) {
  const contents = page.node.Contents()
  const streams = contents instanceof PDFArray ? contents.asArray() : [contents]
  return streams.map(ref => Buffer.from(page.doc.context.lookup(ref, PDFStream).getContents()))
}

test('each single-option print link serves the matching PDF sheet for all 22 days', async () => {
  const checked = new Set<string>()
  for (const packet of catalog) {
    const filename = (manifest as Record<string, string>)[packet.key + '@' + packet.version]
    if (checked.has(filename)) continue
    checked.add(filename)
    const source = await PDFDocument.load(fs.readFileSync('public/student-choice-pages/practice-pdfs/' + filename))
    for (let option = 1; option <= packet.options.length; option++) {
      const href = choicePracticePrintPath(packet, [option])
      const response = await GET(new Request(new URL(href, 'http://fixture')))
      assert.equal(response.headers.get('Content-Type'), 'application/pdf')
      assert.match(response.headers.get('Content-Disposition') ?? '', /\.pdf"$/)
      const pdf = await PDFDocument.load(await response.arrayBuffer())
      assert.equal(pdf.getPageCount(), 1)
      assert.deepEqual(pageContent(pdf.getPage(0)), pageContent(source.getPage(option - 1)))
    }
  }
})

test('all binder notes, paired readings, full units and color keys are printable PDFs', async () => {
  const files = new Map<string, number>()
  for (const p of catalog) {
    for (const note of Object.values(p.notes)) files.set(note.path, 1)
    files.set(p.reference.path, 1)
    for (const print of Object.values(p.printPackets ?? {})) {
      files.set(print.day.path, 2)
      files.set(print.unit.path, 44)
    }
  }
  for (const [path, sheets] of files) {
    assert(path.endsWith('.pdf'), path)
    const document = await PDFDocument.load(fs.readFileSync('public' + path))
    assert.equal(document.getPageCount(), sheets, path)
    assert(document.getPages().every(page => page.getWidth() === 612 && page.getHeight() === 792), path)
  }
})

test('teacher packets and student subsets contain the requested physical Letter pages', async () => {
  const files: Record<string, string> = manifest
  for (const packet of catalog) {
    assert.ok(fs.existsSync('public/student-choice-pages/practice-pdfs/' + files[packet.key + '@' + packet.version]))
  }
  const packet = catalog.find(p => p.day === 12)!
  const url = `http://fixture/student-choice-print?packet=${packet.key}&edition=${packet.version}&options=`
  const request = (choices: string) => GET(new Request(url + choices))
  const full = await request('1,2,3,4,5,6')
  assert.equal(full.headers.get('Content-Type'), 'application/pdf')
  const originals = (await PDFDocument.load(await full.arrayBuffer())).getPages()
  assert.equal(originals.length, 6)
  for (const choices of [[6], [5, 2], [6, 2, 4], [5, 4, 3, 2], [5, 4, 3, 2, 1]]) {
    const response = await request(choices.join(','))
    assert.equal(response.status, 200)
    const result = (await PDFDocument.load(await response.arrayBuffer())).getPages()
    assert.equal(result.length, choices.length)
    choices.sort((a, b) => a - b).forEach((n, i) => {
      assert.deepEqual(result[i].getSize(), { width: 612, height: 792 })
      assert.deepEqual(pageContent(result[i]), pageContent(originals[n - 1]))
    })
  }
  for (const options of ['', '0', '7', '1,1', '1.5', '1,2,3,4,5,6,1', '<script>']) assert.equal((await request(options)).status, 400)
  assert.equal((await GET(new Request('http://fixture/student-choice-print?packet=__proto__&edition=x&options=1'))).status, 404)
})
