// Convert the archived reference sheet and point every edition that uses it at the PDF.
// Run with Playwright and Chromium available, as for package-practice-pdfs.cjs.
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { createHash } = require('node:crypto')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { PDFDocument, PrintScaling } = require('pdf-lib')

async function build() {
  const root = path.resolve(__dirname, '../..')
  const catalogPath = path.join(root, 'src/data/student-choice-binder.json')
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'))
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined })
  try {
    const page = await browser.newPage()
    await page.route(/^https?:/, route => route.abort())
    const paths = new Set(catalog.filter(p => p.reference).map(p => p.reference.path))
    for (const reference of paths) {
      const html = reference.replace(/\.pdf$/, '.html')
      assert(html.endsWith('/color-code.html'), 'Expected an archived color-code sheet')
      const output = html.replace(/\.html$/, '.pdf')
      await page.goto(pathToFileURL(path.join(root, 'public', html)).href)
      await page.evaluate(async () => {
        await customElements.whenDefined('doc-page')
        await document.fonts.ready
        await Promise.all(Array.from(document.images, image => image.decode()))
      })
      const pdf = await PDFDocument.load(await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true }))
      assert.equal(pdf.getPageCount(), 1, html)
      assert.deepEqual(pdf.getPages()[0].getSize(), { width: 612, height: 792 })
      pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None)
      const bytes = await pdf.save()
      const sha256 = createHash('sha256').update(bytes).digest('hex')
      await fs.writeFile(path.join(root, 'public', output), bytes)
      for (const packet of catalog) {
        if (packet.reference?.path === reference) packet.reference = { ...packet.reference, path: output, sha256 }
      }
    }
  } finally { await browser.close() }
  await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n')
}
build().catch(error => { console.error(error); process.exitCode = 1 })
