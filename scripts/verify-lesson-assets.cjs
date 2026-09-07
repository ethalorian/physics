/** Read-only content/reference verifier. Pass snapshot JSON and optional output JSON.
 * --remote checks public HTTP references with HEAD; no authenticated writes. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild');
const input=process.argv[2];if(!input)throw new Error('Usage: node scripts/verify-lesson-assets.cjs snapshot.json [report.json] [--remote]');
const root=path.resolve(__dirname,'..'),rows=JSON.parse(fs.readFileSync(input,'utf8')).filter(l=>l.published);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lesson-assets-'));
async function bundle(entry,name){const out=path.join(temp,name+'.cjs');await esbuild.build({absWorkingDir:root,entryPoints:[entry],outfile:out,bundle:true,platform:'node',format:'cjs'});return require(out)}
(async()=>{
const {TEXTBOOK_SECTIONS}=await bundle('src/data/textbook-sections.ts','sections');
const {textbookChapter}=await bundle('src/data/textbook.ts','textbook');
const simSource=fs.readFileSync(path.join(root,'src/components/simulations/registry.ts'),'utf8');
const animSource=fs.readFileSync(path.join(root,'src/components/animations/registry.ts'),'utf8');
const registered=(source,slug)=>source.includes(`'${slug}':`);
const results=[],remote=new Set();let blocks=0;
function add(l,b,kind,reference,ok,note){results.push({lesson:l.slug,block:b.id,kind,reference,ok,note})}
function walk(l,b,value,key=''){
 if(typeof value==='string'){
  if(['src','visual','href','url','background'].includes(key)&&value.startsWith('/')){
   const route=decodeURIComponent(value.split(/[?#]/)[0]);
   const local=path.join(root,'public',route);
   add(l,b,'local-asset',value,fs.existsSync(local),'File existence only; visual/browser behavior requires acceptance testing.');
  }
  for(const match of value.matchAll(/https?:\/\/[^\s<>"')]+/g))if(!match[0].startsWith('http://www.w3.org/'))remote.add(match[0]);
 }else if(Array.isArray(value))value.forEach(x=>walk(l,b,x,key));else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))walk(l,b,v,k);
}
for(const l of rows)for(const b of l.content_blocks?.blocks??[]){blocks++;walk(l,b,b);
 if(b.type==='sim_embed')add(l,b,'simulation-registry',b.simulationSlug,registered(simSource,b.simulationSlug));
 if(b.type==='animation_3d')add(l,b,'animation-registry',b.animationSlug,registered(animSource,b.animationSlug));
 if(['reading','concept_exercise'].includes(b.type)){
  const chapter=b.chapter;add(l,b,'textbook-chapter',chapter,Boolean(textbookChapter(chapter)),'Private textbook bucket needs authenticated storage check.');
  for(const id of b.sectionIds??[])add(l,b,'textbook-section',id,(TEXTBOOK_SECTIONS[chapter]?.sections??[]).some(s=>s.id===id));
 }
 if(b.type==='figure')add(l,b,'accessible-description',b.src,typeof b.alt==='string'&&b.alt.trim().length>0);
 if(b.type==='deck'&&b.src?.startsWith('/')){
  const local=path.join(root,'public',decodeURIComponent(b.src));
  if(fs.existsSync(local)){const html=fs.readFileSync(local,'utf8');const count=(html.match(/<section\b/g)||[]).length;
   for(const m of b.slideMap??[])add(l,b,'deck-slide-map',`${m.slide}->${m.section}`,Number.isInteger(m.slide)&&m.slide>=0&&m.slide<count&&Number.isInteger(m.section)&&m.section>=0,`${count} deck sections; filtered reader anchor validation occurs at runtime.`);
  }
 }
}
const remoteResults=[];
for(const url of remote){if(!process.argv.includes('--remote')){remoteResults.push({url,verified:false});continue}try{const res=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});remoteResults.push({url,status:res.status,ok:res.ok,finalUrl:res.url})}catch(e){remoteResults.push({url,ok:false,error:e.message})}}
const report={generatedAt:new Date().toISOString(),input,lessons:rows.length,blocks,checks:results.length,failures:results.filter(r=>!r.ok),remote:remoteResults,results,limitations:['File/registry/reference checks do not establish interaction correctness.','Private textbook PDFs require authenticated bucket verification.','Authored deck slide/section intent still requires teacher visual acceptance.']};
const output=process.argv[3]&&!process.argv[3].startsWith('--')?process.argv[3]:null;if(output)fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
