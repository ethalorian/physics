/** Versioned, text-preserving mathematical typography for approved Honors notes. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),parse5=require('parse5');
const root=path.resolve(__dirname,'../..'),resource=path.join(root,'resources/student-choice/honors-notes');
const baseVersion=process.argv[2]||'honors-complete-77f3e9dfede4',exportDir=process.argv[3];
assert(/^[a-z0-9-]+$/.test(baseVersion));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const catalogPath=path.join(root,'src/data/student-choice-binder.json'),catalog=JSON.parse(fs.readFileSync(catalogPath));
const base=catalog.filter(p=>p.version===baseVersion);assert.equal(base.length,22);
const baseDir=path.join(root,'public/student-choice-pages/unit-1',baseVersion);
const bundle=fs.readFileSync(path.join(baseDir,'unit-1-honors-notebook.html'),'utf8');
const css=fs.readFileSync(path.join(resource,'math-typography.css'),'utf8');
const version='honors-math-'+sha(bundle+css+fs.readFileSync(__filename)).slice(0,12);
const url='/student-choice-pages/unit-1/'+version,dest=path.join(root,'public',url);
fs.mkdirSync(dest,{recursive:true});fs.cpSync(path.join(baseDir,'fonts'),path.join(dest,'fonts'),{recursive:true});
for(const f of ['doc-page.js','logo.png'])fs.copyFileSync(path.join(baseDir,f),path.join(dest,f));
for(const f of ['Math-Italic','Main-Regular'])fs.copyFileSync(path.join(root,'node_modules/katex/dist/fonts/KaTeX_'+f+'.woff2'),path.join(dest,'fonts/KaTeX_'+f+'.woff2'));
fs.copyFileSync(path.join(root,'node_modules/katex/LICENSE'),path.join(dest,'fonts/KaTeX-LICENSE.txt'));
const subs={'₀':'0','₁':'1','₂':'2','₃':'3','ᵢ':'i','𝒻':'f','ₓ':'x','ᵧ':'y','ₐ':'A','ᵦ':'B','ₛ':'s','ₖ':'k'};
const content=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(content).join('');
const normalize=s=>s.replace(/[₀₁₂₃ᵢ𝒻ₓᵧₐᵦₛₖ]/gu,c=>subs[c]);
function styleSection(html,day){
 const tree=parse5.parseFragment(html,{sourceCodeLocationInfo:true}),edits=[];let count=0;
 function visit(n,svg=false){
  svg=svg||n.tagName==='svg';
  if(n.tagName==='div'&&n.attrs?.some(a=>a.name==='style'&&a.value.includes('grid-template-columns:auto 1fr;gap:3px 10px'))){
   const labels=n.childNodes.filter(c=>c.tagName==='div');
   labels.forEach((c,i)=>{if(i%2===0){const l=c.sourceCodeLocation;edits.push([l.startTag.endOffset-1,l.startTag.endOffset-1,' class="math-symbol"']);}});
  }
  if(n.tagName==='sub'){
   const l=n.sourceCodeLocation;edits.push([l.startTag.endOffset-1,l.startTag.endOffset-1,' class="math-index"']);return;
  }
  if(n.nodeName==='#text'){
   const l=n.sourceCodeLocation;if(!l)return;
   const raw=html.slice(l.startOffset,l.endOffset),value=n.value;
   if(/^\s*[A-E] ·/.test(value)||/NEW TOOL:|STUDENT CHOICE BINDER|HONORS PHYSICS/.test(value))return;
   const before=html.slice(0,l.startOffset).replace(/<[^>]*>/g,'').slice(-65);
   const next=n.parentNode.childNodes[n.parentNode.childNodes.indexOf(n)+1];
   const wrap=(s,cls)=>'<'+(svg?'tspan':'span')+' class="'+cls+'">'+s+'</'+(svg?'tspan':'span')+'>';
   let text=raw.replace(/(?<![A-Za-z])(?:Fnet|mg|ma|at|vt|[ΔδΣ]?[xyvtafFMTWgRABNmμθ]|[δΔΣ])(?:[\u0304₀₁₂₃ᵢ𝒻ₓᵧₐᵦₛₖ])*(?![A-Za-z])/gu,(token,index)=>{
    const lead=token[0],left=before+raw.slice(0,index),right=raw.slice(index+token.length);
    if(token==='at'&&!/[+½=]\s*$/.test(left))return token;
    if((lead==='A'||lead==='B')&&day!==6)return token;
    if(token==='a'){
     if(day<7||/^\s*\+ direction/.test(right))return token;
     if(next?.tagName==='b'&&!right.trim())return token;
     if(/^\s+[A-Za-z]/.test(right)&&!/^\s+(?:have|oppose|can|only|at fixed|against|does|and v|is upward|keeps|from|for a)\b/.test(right))return token;
    }
    if(token==='m'&&!/^\s*[=(]/.test(right)&&next?.tagName!=='sub'&&!/[/÷]\s*$/.test(left))return token;
    if(token==='N'&&!/^\s*[=≈+−]/.test(right)&&(/(?:\d|units:|rope,)\s*$/.test(left)||/^\s*[/)]/.test(right)))return token;
    count++;
    if(token==='Fnet')return wrap('F','math-var')+wrap('net','math-svg-index');
    const indexStart=token.search(/[₀₁₂₃ᵢ𝒻ₓᵧₐᵦₛₖ]/u),base=indexStart<0?token:token.slice(0,indexStart),indices=indexStart<0?'':token.slice(indexStart);
    const operator=/^[ΔΣδ]/.test(base)?base[0]:'',letters=base.slice(operator.length);
    return (operator?wrap(operator,'math-operator'):'')+(letters?wrap(letters,'math-var'):'')+[...indices].map(c=>wrap(subs[c],'math-unicode-index')).join('');
   });
   if(text!==raw)edits.push([l.startOffset,l.endOffset,text]);
  }
  for(const c of n.childNodes||[])visit(c,svg);
 }
 visit(tree);
 for(const [a,b,value]of edits.sort((a,b)=>b[0]-a[0]))html=html.slice(0,a)+value+html.slice(b);
 assert.equal(normalize(content(parse5.parseFragment(html))),normalize(content(tree)),'Text changed on day '+day);
 return {html,count};
}
const sections=[...bundle.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(m=>m[0]);assert.equal(sections.length,22);
const prefix=bundle.slice(0,bundle.indexOf(sections[0])).replace('</head>','<style>'+css+'</style></head>'),suffix=bundle.slice(bundle.lastIndexOf('</section>')+10);
const styled=sections.map((s,i)=>styleSection(s,i+1));
const next=base.map(p=>({...p,version,notes:{...p.notes}})),pages=[];
for(const p of next){
 const item=styled[p.day-1],name='day-'+String(p.day).padStart(2,'0')+'-honors-notes.html',html=prefix.replace(/<title>[^<]*<\/title>/,'<title>Honors notebook · Day '+p.day+' · Student Choice</title>')+item.html+suffix;
 fs.writeFileSync(path.join(dest,name),html);p.notes.honors={...p.notes.honors,path:url+'/'+name,sha256:sha(html)};
 pages.push({day:p.day,file:name,sha256:sha(html),styledSymbols:item.count});
 const old=base.find(b=>b.day===p.day);assert.deepEqual(p.notes.cpa,old.notes.cpa);assert.deepEqual(p.options,old.options);assert.deepEqual(p.reference,old.reference);
}
const notebook=prefix+styled.map(s=>s.html).join('\n\n')+suffix;fs.writeFileSync(path.join(dest,'unit-1-honors-notebook.html'),notebook);
fs.writeFileSync(catalogPath,JSON.stringify([...next,...catalog.filter(p=>p.version!==version)],null,2)+'\n');
const manifest={version,baseVersion,authorization:'Craig requested clearer variable typography across Honors notes, November 5, 2026',change:'Italic mathematical symbols, upright units/operators and clear indices; wording and diagram geometry preserved',pages,bundle:{file:'unit-1-honors-notebook.html',sha256:sha(notebook)},textPreservation:'all 22 sections matched',originalEditionsUnchanged:true,practiceAndCPAUnchanged:true,oldAssignmentsRemainPinned:true,verification:'pending rendered checks'};
fs.writeFileSync(path.join(root,'docs/student-choice',version+'.json'),JSON.stringify(manifest,null,2)+'\n');
if(exportDir){fs.mkdirSync(exportDir,{recursive:true});fs.cpSync(dest,exportDir,{recursive:true});fs.writeFileSync(path.join(exportDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');}
console.log(JSON.stringify({version,pages:pages.length,symbols:pages.reduce((n,p)=>n+p.styledSymbols,0),publicFolder:dest}));
