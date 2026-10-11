const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),out=process.env.OUTPUT_DIR||'/private/tmp/etf-decks-work/visual';fs.mkdirSync(out,{recursive:true});
const manifest=require(root+'/src/data/trades-etf-decks.json');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'public','.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/public/')||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end()}res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:1280,height:784}}),errors=[],overflow=[],screens=[],seenVisuals=new Set();page.on('pageerror',e=>errors.push(e.message));
 try {
  for(const deck of manifest){
   await page.goto(base+deck.src);await page.waitForSelector('.slide.active');await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
   for(let i=0;i<deck.slides;i++){
    const result=await page.evaluate(index=>{const stage=document.querySelector('deck-stage');stage.goTo(index);const s=document.querySelector('.slide.active'),footer=s.querySelector('.footer').getBoundingClientRect();const elements=[s.querySelector('h1,h2'),...s.querySelectorAll('.content > *,.workshop-copy,.workshop-copy > *,.close-grid > *')];const svg=s.querySelector('svg');const clipped=svg?[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox(),v=svg.viewBox.baseVal;return b.x<v.x-1||b.y<v.y-1||b.x+b.width>v.x+v.width+1||b.y+b.height>v.y+v.height+1}).map(t=>({text:t.textContent,reason:'SVG crop crosses text'})):[];const bad=elements.filter(e=>{const b=e.getBoundingClientRect();return b.bottom>footer.top-12||b.right>s.getBoundingClientRect().right-40}).map(e=>({text:e.textContent.slice(0,100),bottom:e.getBoundingClientRect().bottom,footer:footer.top}));return {title:s.dataset.title,bad:[...bad,...clipped]};},i);
    if(result.bad.length)overflow.push({slug:deck.slug,slide:i+1,...result});
    if(deck.day===1||deck.day===2&&deck.unit===1||result.title&&await page.locator('.slide.active.visual').count()&&!seenVisuals.has(result.title)){seenVisuals.add(result.title);const name=deck.slug+'-'+String(i+1).padStart(2,'0')+'.png';await page.locator('deck-stage').screenshot({path:out+'/'+name});screens.push({unit:deck.unit,slug:deck.slug,slide:i+1,title:result.title,name});}
   }
  }
  for(const unit of [1,2,3,4]){
   const cards=screens.filter(s=>s.unit===unit).map(s=>'<figure><img src="data:image/png;base64,'+fs.readFileSync(out+'/'+s.name).toString('base64')+'"><figcaption>'+s.slug+' / '+s.slide+' · '+s.title+'</figcaption></figure>').join('');
   await page.setViewportSize({width:1440,height:1000});await page.setContent('<style>body{margin:16px;font:14px Arial;background:#e5e9e8;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}figure{margin:0}img{width:100%}figcaption{padding:5px}</style>'+cards);await page.screenshot({path:out+'/unit-'+unit+'-contact.png',fullPage:true});
  }
  const report={decks:manifest.length,slides:manifest.reduce((s,d)=>s+d.slides,0),errors,overflow};fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.deepEqual(overflow,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
