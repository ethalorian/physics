/** Browser regressions for the shared design system, real markdown and lesson/game UI. */
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const root = path.resolve(__dirname, '..')
const out = fs.mkdtempSync('/private/tmp/styling-browser-')
let browser, server

async function main() {
  const markdown = '# Motion in one dimension\n\nCompare $v$ and $t$ using the model below.\n\n$$\nv = \\frac{\\Delta x}{\\Delta t}\n$$\n\n| Quantity | Unit |\n| --- | --- |\n| Velocity | m/s |\n| Time | s |\n\n> Explain what the slope tells you.\n\n```js\nconst speed = distance / time;\n```\n\n' + ['info', 'note', 'tip', 'caution', 'warning'].map(t => `:::${t}${t==='note'?' Units matter':''}\nUse **units** and explain your reasoning.\n:::\n`).join('\n')
  await require('esbuild').build({
    stdin: { resolveDir: root, loader: 'tsx', contents: `
      import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
      import {Button} from './src/components/ui/button';
      import {Card,CardHeader,CardTitle,CardContent} from './src/components/ui/card';
      import {Input} from './src/components/ui/input'; import {Textarea} from './src/components/ui/textarea';
      import {Spinner} from './src/components/ui/spinner'; import {Toast} from './src/components/ui/toast';
      import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetDescription} from './src/components/ui/sheet';
      import MathMarkdown from './src/components/MathMarkdown';
      import {MC,YearBanner} from './src/app/simulations/measure-of-all-things/ui';
      import Matching from './src/components/vocabulary/games/VocabularyMatchingGame';
      import Quiz from './src/components/vocabulary/games/VocabularyQuizBowlGame';
      import ArcadeEndScreen from './src/components/vocabulary/arcade/ArcadeEndScreen';
      const terms=[{id:'a',term:'velocity',definition:'Speed with direction',difficulty:'easy'},{id:'b',term:'distance',definition:'Length of the path',difficulty:'easy'}];
      function App(){const [hidden,hide]=useState(false);return <main className="mx-auto max-w-6xl space-y-8 p-6">
        <h1 className="text-title-1">Physics classroom · styling review</h1>
        <section className="grid gap-6 md:grid-cols-2">
          <Card id="standard-card"><CardHeader><CardTitle>Shared controls</CardTitle></CardHeader><CardContent className="space-y-4">
            <label className="block">Measurement<Input aria-label="Measurement" placeholder="Enter a value"/></label>
            <Textarea aria-label="Reasoning" placeholder="Explain your reasoning"/>
            <div className="flex flex-wrap items-center gap-3"><Button id="primary-action">Save response</Button><Button variant="destructive" id="delete-action">Delete draft</Button><Button size="sm">Small action</Button><Spinner size="sm"/><Spinner/><Spinner size="lg"/></div>
            <Sheet><SheetTrigger asChild><Button variant="outline">Open details</Button></SheetTrigger><SheetContent><SheetTitle>Lesson details</SheetTitle><SheetDescription>Review the evidence.</SheetDescription></SheetContent></Sheet>
          </CardContent></Card>
          <Card density="compact" id="compact-card"><CardHeader><CardTitle>Compact lesson check</CardTitle></CardHeader><CardContent className="space-y-4">
            <YearBanner year="1791" place="Paris"/><MC prompt="Which unit measures length?" choices={['Seconds','Metres']} answer={1} explain="Correct. Metres measure length." onDone={()=>{}}/>
            <p id="success-text" className="text-sm text-success">Complete · your work is saved.</p><p id="error-text" className="text-sm text-destructive">Check the unit and try again.</p>
          </CardContent></Card>
        </section>
        <section aria-label="Notifications" className="grid gap-3 md:grid-cols-2">{['default','success','error','warning','info'].map(variant=>variant==='default'&&hidden?null:<Toast key={variant} id={variant} variant={variant} title={variant+' notification'} description="Your lesson status is available in this theme." onClose={variant==='default'?()=>hide(true):undefined}/>)}</section>
        <Card><CardContent><MathMarkdown content={${JSON.stringify(markdown)}}/></CardContent></Card>
        <section aria-label="Matching game"><Matching question={{id:'q',type:'vocabulary_matching',vocabularyTerms:terms}}/></section>
        <section aria-label="Quiz game"><Quiz vocabularyTerms={terms} difficulty="easy"/></section>
        <section aria-label="Game summary"><ArcadeEndScreen gameType="matching" gameTitle="Matching" score={12} detail="2 of 2 matched" onPlayAgain={()=>{}}/></section>
      </main>};createRoot(document.getElementById('root')).render(<App/>);` },
    bundle: true, format: 'esm', jsx: 'automatic', outfile: out + '/app.js',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'local-fixture', setup(build) {
      const mocks = {
        'next-auth/react': 'export const useSession=()=>({data:null,status:"unauthenticated"})',
        'next/link': "import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>}",
      }
      build.onResolve({ filter: /.*/ }, a => mocks[a.path] ? { path: a.path, namespace: 'fixture' } : undefined)
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'tsx', resolveDir: root }))
    } }],
  })
  // When requested, use the exact stylesheet emitted by next build, including
  // hashed KaTeX fonts. Otherwise run the production PostCSS pipeline directly.
  let css
  if (process.env.STYLING_PRODUCTION_CSS === '1') {
    const dir = path.join(root, '.next/static/css')
    css = fs.readdirSync(dir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
      .replaceAll('../media/', '/_next/static/media/')
  } else {
    css = (await require('postcss')([require(path.join(root, 'node_modules/@tailwindcss/postcss/dist/index.js'))({ base: root, optimize: true })])
      .process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' })).css
  }
  if (fs.existsSync(out + '/app.css')) css += '\n' + fs.readFileSync(out + '/app.css', 'utf8')
  fs.writeFileSync(out + '/style.css', css)
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture')
    if (url.pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); return res.end(url.pathname.includes('game-scores') ? '[]' : '{}') }
    let file
    if (url.pathname.startsWith('/_next/static/media/')) file = path.join(root, '.next/static/media', path.basename(url.pathname))
    else if (url.pathname.includes('/fonts/')) file = path.join(root, 'node_modules/katex/dist/fonts', path.basename(url.pathname))
    else if (['/app.js', '/style.css'].includes(url.pathname)) file = out + url.pathname
    if (file && fs.existsSync(file)) {
      res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'font/woff2')
      return res.end(fs.readFileSync(file))
    }
    res.setHeader('Content-Type', 'text/html')
    res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('http://127.0.0.1:' + server.address().port)
  await page.getByText('Shared controls', { exact: true }).waitFor()
  console.log('Fixture loaded; checking typography and geometry.')
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.getByRole('status', { name: 'Loading', exact: true }).count(), 3)
  assert.equal(await page.locator('.katex-display .katex-html').count(), 1)
  assert.equal(await page.locator('.katex-error').count(), 0)
  assert.equal(await page.locator('.admonition-note strong').first().textContent(), 'Units matter')
  assert(!/\*\*/.test(await page.locator('.admonition-note').innerText()), 'callout Markdown renders without literal markers')
  await page.locator('canvas').waitFor({state:'detached'})
  assert.match(await page.locator('.katex .mord').first().evaluate(el => getComputedStyle(el).fontFamily), /KaTeX/)
  assert(await page.evaluate(() => document.fonts.check('16px KaTeX_Main')), 'KaTeX font loaded')

  const metrics = await page.evaluate(() => {
    const style = selector => getComputedStyle(document.querySelector(selector))
    return {
      card: style('#standard-card').borderRadius, button: style('#primary-action').borderRadius,
      input: style('input').borderRadius, blur: style('#standard-card').backdropFilter,
      compact: style('#compact-card').paddingLeft, inset: style('#compact-card [data-slot="card-content"]').paddingLeft,
    }
  })
  assert.deepEqual(metrics, { card: '16px', button: '12px', input: '12px', blur: 'none', compact: '16px', inset: '0px' })

  // Contrast is calculated from the browser's composited colors, not token names.
  async function contrast(selector) {
    return page.locator(selector).first().evaluate(el => {
      const ctx = document.createElement('canvas').getContext('2d')
      function rgba(color) { ctx.clearRect(0,0,1,1); ctx.fillStyle=color; ctx.fillRect(0,0,1,1); return Array.from(ctx.getImageData(0,0,1,1).data).map((v,i)=>i===3?v/255:v/255) }
      function over(f,b) { return [0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3])).concat(1) }
      let bg=[1,1,1,1],nodes=[]; for(let n=el;n;n=n.parentElement)nodes.unshift(n)
      for(const n of nodes)bg=over(rgba(getComputedStyle(n).backgroundColor),bg)
      const fg=over(rgba(getComputedStyle(el).color),bg)
      const lum=c=>c.slice(0,3).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0)
      return (Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05)
    })
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), theme === 'dark')
    await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})))
    })
    for (const selector of ['#primary-action', '#delete-action', '[aria-label="Notifications"] [role="status"] .text-sm', '.markdown-content th', '#success-text', '#error-text']) {
      const ratio = await contrast(selector)
      assert(ratio >= 4.5, `${theme} ${selector} contrast ${ratio.toFixed(2)} < 4.5`)
    }
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} overflow at ${width}`)
      await page.screenshot({ path: `${out}/${theme}-${width}.png`, fullPage: true })
    }
    const labels = await page.locator('.markdown-content [class^="admonition-"]').evaluateAll(elements => elements.map(el=>getComputedStyle(el,'::before').content))
    assert.deepEqual(labels, ['"info"','"note"','"tip"','"caution"','"warning"'])
  }

  await page.getByLabel('Measurement', { exact: true }).focus()
  assert.match(await page.getByLabel('Measurement', { exact: true }).evaluate(el=>getComputedStyle(el).boxShadow), /2px/, 'keyboard focus has a visible ring')
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  assert.equal(await page.getByText('default notification', { exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Open details' }).click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Seconds', exact: true }).click()
  await page.getByText('Not quite — think it through and try another.').waitFor()
  await page.getByRole('button', { name: 'Metres', exact: true }).click()
  await page.getByText('Correct. Metres measure length.').waitFor()
  const matching = page.getByRole('region', { name: 'Matching game' })
  await matching.getByText('velocity', { exact: true }).click()
  await matching.getByText('Speed with direction', { exact: true }).click()
  await page.waitForFunction(()=>document.querySelector('[aria-label="Matching game"] .bg-success\\/25'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.getByRole('status', { name: 'Loading', exact: true }).first().locator('svg').evaluate(el=>getComputedStyle(el).animationName), 'none')
  assert.deepEqual(errors, [])
  console.log(`PASS: real production components, light/dark contrast, 1366/390 layouts, compact density, keyboard focus, toast dismissal, Sheet open/close, KaTeX fonts/math, lesson correct/incorrect feedback, vocabulary match, and reduced motion. Screenshots: ${out}`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(async () => { await browser?.close(); server?.close() })
