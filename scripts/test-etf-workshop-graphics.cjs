const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),out=process.env.OUTPUT_DIR||'/private/tmp/etf-workshop-graphics';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(root,'public',new URL(req.url,'http://localhost').pathname);if(!fs.existsSync(f)){res.statusCode=404;return res.end()}res.setHeader('Content-Type','image/svg+xml');res.end(fs.readFileSync(f))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:840,height:490}}),errors=[],clipped=[],overlap=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const names=fs.readdirSync(root+'/public/trades-etf/workshop').filter(n=>n.endsWith('.svg'));
  for(const name of names){await page.goto(base+'/trades-etf/workshop/'+name);
   assert.equal(await page.locator('parsererror').count(),0,name+' must be valid SVG');
   const result=await page.evaluate(()=>{const boxes=[...document.querySelectorAll('text')].map(t=>({text:t.textContent,b:t.getBBox()}));return {clipped:boxes.filter(({b})=>b.x<0||b.y<0||b.x+b.width>841||b.y+b.height>491).map(x=>x.text),overlap:boxes.flatMap((a,i)=>boxes.slice(i+1).filter(c=>Math.min(a.b.x+a.b.width,c.b.x+c.b.width)-Math.max(a.b.x,c.b.x)>4&&Math.min(a.b.y+a.b.height,c.b.y+c.b.height)-Math.max(a.b.y,c.b.y)>3).map(c=>[a.text,c.text]))}});
   if(result.clipped.length)clipped.push({name,text:result.clipped});if(result.overlap.length)overlap.push({name,pairs:result.overlap});
   await page.screenshot({path:out+'/'+name+'.png'});
  }
  await page.goto('about:blank');
  for(let start=0;start<names.length;start+=20){const subset=names.slice(start,start+20);await page.setViewportSize({width:1680,height:1000});await page.setContent('<style>body{margin:16px;background:#ddd;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;font:14px Arial}figure{margin:0}img{width:100%}figcaption{padding:5px}</style>'+subset.map(n=>'<figure><img src="data:image/png;base64,'+fs.readFileSync(out+'/'+n+'.png').toString('base64')+'"><figcaption>'+n+'</figcaption></figure>').join(''));await page.screenshot({path:out+'/contact-'+start+'.png',fullPage:true});}
  const report={assets:names.length,errors,clipped,overlap};fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.deepEqual(errors,[]);assert.deepEqual(clipped,[]);assert.deepEqual(overlap,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
