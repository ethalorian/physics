// Run after package-practice-print.cjs with Playwright and Chromium available.
// Set CHROME_BIN to use an installed Chrome. No external web requests are made.
const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { PDFDocument, PrintScaling } = require('pdf-lib')
const catalog = require('../../src/data/student-choice-binder.json')
const { packets, pages } = require('../../src/data/student-choice-practice-print.json')

const root = path.resolve(__dirname, '../..')
const publicDir = path.join(root, 'public')
const output = path.join(publicDir, 'student-choice-pages/practice-pdfs')
const origin = 'http://binder.test'
const mime = { '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.svg': 'image/svg+xml' }

async function build() {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  await fs.mkdir(output, { recursive: true })
  const manifest = {}
  const built = new Map()
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined })
  try {
    const page = await browser.newPage()
    let html = ''
    await page.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (url.origin !== origin) throw Error('Unexpected external resource: ' + url.origin)
      if (url.pathname === '/packet') return route.fulfill({ contentType: 'text/html', body: html })
      assert.ok(url.pathname.startsWith('/student-choice-pages/'), url.pathname)
      const file = path.join(publicDir, decodeURIComponent(url.pathname))
      return route.fulfill({ body: await fs.readFile(file), contentType: mime[path.extname(file)] })
    })
    for (const packet of catalog) {
      const key = packet.key + '@' + packet.version
      const entry = packets[key]
      html = entry.head + entry.paths.map(p => pages[p]).join('\n') + '</doc-page></body></html>'
      const sourceHash = crypto.createHash('sha256').update(html).digest('hex')
      if (!built.has(sourceHash)) {
        await page.goto(origin + '/packet', { waitUntil: 'load' })
        await page.evaluate(async () => { await customElements.whenDefined('doc-page'); await document.fonts.ready })
        const bytes = await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true })
        const proof = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise
        try {
          assert.equal(proof.numPages, packet.options.length, key)
          for (let number = 1; number <= proof.numPages; number++) {
            const sheet = await proof.getPage(number)
            assert.deepEqual(sheet.view, [0, 0, 612, 792], key)
            const words = (await sheet.getTextContent()).items.map(item => item.str).join(' ')
            const option = [...words.matchAll(/OPTION\s+([1-6])\s*·\s*STYLE/gi)].map(match => Number(match[1]))
            assert.deepEqual(option, [number], key + ' printed page ' + number)
          }
        } finally { await proof.destroy() }
        const pdf = await PDFDocument.load(bytes)
        pdf.setTitle(packet.key + ' · All six Student Choice practice options')
        pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None)
        const filename = packet.key + '-' + sourceHash.slice(0, 12) + '.pdf'
        await fs.writeFile(path.join(output, filename), await pdf.save())
        built.set(sourceHash, filename)
      }
      manifest[key] = built.get(sourceHash)
    }
  } finally { await browser.close() }
  await fs.writeFile(path.join(root, 'src/data/student-choice-practice-pdfs.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('Verified ' + built.size + ' practice PDFs for ' + Object.keys(manifest).length + ' day editions.')
}
build().catch(error => { console.error(error); process.exitCode = 1 })
