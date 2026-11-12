/* Preserve the first six physical sheets from the pinned PDF, then append only new sheets.
   Run after build-visual-language.cjs and package-practice-print.cjs. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto')
const {chromium}=require('playwright'),{PDFDocument,PrintScaling}=require('pdf-lib')
const root=path.resolve(__dirname,'../..'),pub=path.join(root,'public'),origin='http://binder.test'
const catalog=require('../../src/data/student-choice-binder.json'),{packets,pages}=require('../../src/data/student-choice-practice-print.json')
const mf=path.join(root,'src/data/student-choice-practice-pdfs.json'),manifest=JSON.parse(fs.readFileSync(mf))
const dir=path.join(pub,'student-choice-pages/practice-pdfs'),mime={'.js':'text/javascript','.png':'image/png','.ttf':'font/ttf','.css':'text/css','.svg':'image/svg+xml','.html':'text/html'}
;(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,args:['--disable-dev-shm-usage','--disable-gpu','--disk-cache-size=1']})
 try{
  const page=await browser.newPage({viewport:{width:816,height:1056}})
  let html=''
  await page.route('**/*',route=>{const u=new URL(route.request().url());assert.equal(u.origin,origin);if(u.pathname==='/pages')return route.fulfill({contentType:'text/html',body:html});assert(u.pathname.startsWith('/student-choice-pages/'));return route.fulfill({contentType:mime[path.extname(u.pathname)],body:fs.readFileSync(path.join(pub,decodeURIComponent(u.pathname)))})})
  for(const p of catalog.slice(0,22)){
   assert(p.version.startsWith('visual-sei-'));const names=p.options.map(o=>o.path),entry=packets[p.key+'@'+p.version]
   html=entry.head+names.slice(6).map(n=>pages[n]).join('\n')+'</doc-page></body></html>'
   await page.goto(origin+'/pages',{waitUntil:'load'});await page.evaluate(async()=>{await customElements.whenDefined('doc-page');await document.fonts.ready})
   const over=await page.evaluate(()=>[...document.querySelectorAll('.sei-shell')].flatMap(main=>{const rect=main.getBoundingClientRect(),key=main.querySelector('.sei-key').getBoundingClientRect(),foot=main.querySelector('footer').getBoundingClientRect(),last=main.querySelector('.sei-lesson').lastElementChild.getBoundingClientRect();let out=[];if(key.top-last.bottom<10||rect.bottom-foot.bottom<22)out.push('footer gap');for(const el of main.querySelectorAll('.sei-box,.sei-card,.sei-lesson,.sei-key,.sei-top'))if(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)out.push(el.className+' overflow');return out}))
   assert.deepEqual(over,[],p.key+' geometry '+over.join(', '))
   const bytes=await page.pdf({format:'Letter',preferCSSPageSize:true,printBackground:true})
   const add=await PDFDocument.load(bytes),old=await PDFDocument.load(fs.readFileSync(path.join(dir,manifest[p.key+'@layout-1215defe2f22'])))
   assert.equal(old.getPageCount(),6);assert.equal(add.getPageCount(),names.length-6,p.key)
   for(const q of await old.copyPages(add,add.getPageIndices())){assert.deepEqual(q.getSize(),{width:612,height:792});old.addPage(q)}
   old.setTitle(p.key+' · All '+names.length+' Student Choice practice options');old.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None)
   const final=await old.save(),file=p.key+'-'+crypto.createHash('sha256').update(final).digest('hex').slice(0,12)+'.pdf';fs.writeFileSync(path.join(dir,file),final);manifest[p.key+'@'+p.version]=file
  }
  fs.writeFileSync(mf,JSON.stringify(manifest,null,2)+'\n');console.log('Verified and packaged 22 daily PDFs for '+catalog[0].version)
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1})
