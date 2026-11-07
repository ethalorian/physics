/** Author the requested missing Honors days; never rewrite approved original sheets. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),resource=path.join(root,'resources/student-choice/honors-notes');
const source=process.argv[2],exportDir=process.argv[3];
if(!source)throw Error('Usage: node scripts/student-choice/generate-honors-notes.cjs <original-project-folder> [export-folder]');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const specs=JSON.parse(fs.readFileSync(path.join(resource,'unit-1.json')));
assert.deepEqual(specs.map(s=>s.day),Array.from({length:19},(_,i)=>i+4));
const template=fs.readFileSync(path.join(resource,'template-day-03.html'),'utf8');
const head=fs.readFileSync(path.join(resource,'template-head.html'),'utf8');
const figures=require('./honors-figures.cjs');
const originalHTML=fs.readFileSync(path.join(source,'Unit 1 Honors Notebook Pages.dc.html'),'utf8');
const originalSections=[...originalHTML.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(x=>x[0]);
assert.equal(originalSections.length,3);assert.equal(template,originalSections[2]);
const catalogPath=path.join(root,'src/data/student-choice-binder.json');
const previous=JSON.parse(fs.readFileSync(catalogPath));
const base=previous.filter(p=>p.version==='original-1805385887d1');assert.equal(base.length,22);
const generatorHash=hash(fs.readFileSync(__filename));
const version='honors-complete-'+hash(JSON.stringify(specs)+template+head+fs.readFileSync(path.join(__dirname,'honors-figures.cjs'))+generatorHash).slice(0,12);
const url='/student-choice-pages/unit-1/'+version,dest=path.join(root,'public',url);
fs.mkdirSync(dest,{recursive:true});fs.mkdirSync(path.join(dest,'fonts'),{recursive:true});
for(const f of ['doc-page.js','logo.png',...fs.readdirSync(path.join(source,'fonts')).map(x=>'fonts/'+x)])fs.copyFileSync(path.join(source,f),path.join(dest,f));
function replaceInner(html,marker,content){
 const start=html.indexOf(marker);assert(start>=0,'Missing template region '+marker);
 const openEnd=html.indexOf('>',start)+1;let depth=1,end=-1;const re=/<\/?div\b[^>]*>/g;re.lastIndex=openEnd;let m;
 while((m=re.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=m.index;break;}}
 assert(end>=0);return html.slice(0,openEnd)+content+html.slice(end);
}
const div=style=>'<div style="'+style+'">';
function format(s){
 const subs={'𝒻':'f','ᵢ':'i','₀':'0','ₓ':'x','ᵧ':'y','ₐ':'A','ᵦ':'B','ₛ':'s','ₖ':'k'};
 return s.split(/(<[^>]*>)/).map((part,i)=>i%2?part:part
 .replace(/Fnet|Fdrive|Fright|Fleft/g,m=>'F<sub>'+m.slice(1)+'</sub>')
 .replace(/[𝒻ᵢ₀ₓᵧₐᵦₛₖ]/gu,m=>'<sub>'+subs[m]+'</sub>')
 .replace(/\b(north|south|east|west)(?:ward)?\b/gi,m=>'<i><u>'+m+'</u></i>')
 .replace(/(?<![\w>])([+−-]?\d+(?:[,.]\d+)*(?:\s*±\s*\d+(?:\.\d+)?)?\s*(?:m\/s²|m\/s|N\/kg|m\/s|kg|km\/s|m|N|s|°))(?![\w<])/g,'<b>$1</b>')).join('');
}
const vocabStyle='display:grid;grid-template-columns:auto 1fr;font-size:14px;line-height:1.2';
const unitStyle='display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:15px';
const eqStyle="border:1.5px solid #252525;background:#f7f7f7;padding:12px;font:500 20px/1.4 'IBM Plex Mono',monospace;text-align:center";
const legendStyle='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;font-size:14px;line-height:1.2';
const rowStyle='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1.5px solid #252525;font-size:14.5px;line-height:1.3';
const generated=[],allSections=[...originalSections],newCatalog=base.map(p=>({...p,notes:{...p.notes},version}));
for(const d of specs){
 const packet=newCatalog.find(p=>p.day===d.day),dd=String(d.day).padStart(2,'0');let s=template;
 s=s.replace('id="day-3" data-screen-label="Day 3"','id="day-'+d.day+'" data-screen-label="Day '+d.day+'"').replace('UNIT 1 · DAY 3','UNIT 1 · DAY '+d.day);
 s=replaceInner(s,div('font-size:29px;font-weight:500;line-height:1.05;letter-spacing:-.01em;margin-top:5px'),d.title);
 const target=d.target||packet.target;
 s=replaceInner(s,div('font-size:17px;font-weight:500;line-height:1.2'),format(target));
 const originalCPA=fs.readFileSync(path.join(root,'public',packet.notes.cpa.path),'utf8');
 const code=originalCPA.match(/LEARNING TARGET · ([^<]+)/)?.[1];if(code)s=s.replace('>LEARNING TARGET</div>','>LEARNING TARGET · '+code+'</div>');
 s=replaceInner(s,div(vocabStyle),d.vocab.map(([term,meaning],i)=>'<div style="font-weight:600;padding:3px 10px 3px 0;'+(i<3?'border-bottom:1px solid #d6d6d6':'')+'">'+format(term)+'</div><div style="padding:3px 0;'+(i<3?'border-bottom:1px solid #d6d6d6':'')+'">'+format(meaning)+'</div>').join('\n'));
 s=s.replace('B · KEY EQUATION + UNITS','B · KEY EQUATIONS + UNITS');
 s=replaceInner(s,div(eqStyle),format(d.eq[0])+'<div style="font-size:14px;border-top:1px solid #d6d6d6;margin-top:6px;padding-top:6px">'+format(d.eq[1])+'</div>');
 s=replaceInner(s,div(unitStyle),d.units.map(([symbol,meaning])=>'<div style="font:500 13px \'IBM Plex Mono\',monospace">'+format(symbol)+'</div><div>'+format(meaning)+'</div>').join(''));
 s=s.replace('C · COLOR IT · READ A GRAPH AS A MOTION STORY','C · COLOR IT · '+d.ctitle).replace('Height = position. Slope = velocity.',format(d.csubtitle));
 s=s.replace(/<svg[\s\S]*?<\/svg>/,figures(d.figure));
 s=replaceInner(s,div(legendStyle),d.legend.map(([color,label],i)=>'<div style="display:flex;gap:8px;align-items:center"><div style="width:26px;height:18px;border:1.5px solid #252525;flex:none"></div><div><strong style="font:600 12px \'IBM Plex Mono\',monospace">'+(i+1)+' · '+color+'</strong><br>'+format(label)+'</div></div>').join(''));
 s=replaceInner(s,div('font-size:15.5px;line-height:1.3'),format(d.example.prompt));
 const cells=[['GIVEN',d.example.given],['EQUATION',d.example.equation],['WORK',d.example.work],['ANSWER','<strong style="font-size:17px">'+format(d.example.answer)+'</strong><br>'+format(d.example.remark)]];
 s=replaceInner(s,div(rowStyle),cells.map(([label,value],i)=>'<div style="padding:7px 9px;'+(i<3?'border-right:1px solid #252525':'background:#f7f7f7')+'"><div style="font:600 12px \'IBM Plex Mono\',monospace;letter-spacing:.1em;margin-bottom:4px">'+label+'</div>'+(i===3?value:format(value))+'</div>').join(''));
 s=s.replace('DAY 3 OF 22 · NEW TOOL: AVERAGE VELOCITY','DAY '+d.day+' OF 22 · NEW TOOL: '+d.tool);
 s=replaceInner(s,div('font-size:15.5px;line-height:1.35'),format(d.thread));
 // New authored pages follow the minimum label size; archived pages stay exact.
 s=s.replace(/font:(500|600) (?:10\.5|11)px/g,'font:$1 12px');
 assert.equal((s.match(/<section /g)||[]).length,1);assert(!s.includes('undefined'));
 const name='day-'+dd+'-honors-notes.html',html=wrap(s,'HONORS notebook · Day '+d.day);
 fs.writeFileSync(path.join(dest,name),html);
 packet.notes.honors={title:'HONORS notebook · Day '+d.day,path:url+'/'+name,sha256:hash(html),target};
 generated.push({day:d.day,file:name,sha256:hash(html),sectionSha256:hash(s),figure:d.figure,newlyAuthored:true});
 allSections.push(s);
}
function wrap(section,title){return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+head+'<title>'+title+' · Student Choice</title><style>.binder-tools{padding:12px 20px;display:flex;gap:16px;align-items:center;background:white;color:#171717;font:15px system-ui}.binder-tools button{font:inherit;padding:8px 18px;cursor:pointer}@media print{.binder-tools{display:none!important}*,*::before,*::after{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><nav class="binder-tools" aria-label="Page printing"><button type="button" onclick="window.print()">Print pages</button><span>US Letter · 100% scale · Turn on background graphics</span></nav><doc-page size="letter">\n'+section+'\n</doc-page></body></html>\n';}
const bundle=wrap(allSections.join('\n\n'),'Unit 1 Honors notebook · All 22 days');
fs.writeFileSync(path.join(dest,'unit-1-honors-notebook.html'),bundle);
for(const p of newCatalog){const old=base.find(b=>b.key===p.key);assert.deepEqual(p.options,old.options);assert.deepEqual(p.notes.cpa,old.notes.cpa);assert.deepEqual(p.reference,old.reference);if(p.day<=3)assert.deepEqual(p.notes.honors,old.notes.honors);}
fs.writeFileSync(catalogPath,JSON.stringify([...newCatalog,...previous.filter(p=>p.version!==version)],null,2)+'\n');
const manifest={version,generatedBy:'Codex in this conversation; no Claude or external model API invoked',authorization:'Craig requested Honors notes for all days using this session, November 5, 2026',templateSource:'Unit 1 Honors Notebook Pages.dc.html#day-3',templateSha256:hash(template),generatorSha256:generatorHash,originalVersion:'original-1805385887d1',originalHonorsDaysPreserved:[1,2,3],newHonorsDays:generated,daysAvailable:22,practiceOptionsAndCPAPagesUnchanged:true,oldAssignmentsRemainPinned:true,bundle:{file:'unit-1-honors-notebook.html',sha256:hash(bundle)},verification:'pending rendered checks'};
fs.writeFileSync(path.join(root,'docs/student-choice',version+'.json'),JSON.stringify(manifest,null,2)+'\n');
if(exportDir){fs.mkdirSync(exportDir,{recursive:true});fs.cpSync(dest,exportDir,{recursive:true});fs.copyFileSync(path.join(resource,'unit-1.json'),path.join(exportDir,'authored-specifications.json'));fs.copyFileSync(path.join(root,'docs/student-choice',version+'.json'),path.join(exportDir,'manifest.json'));}
console.log(JSON.stringify({version,newHonorsPages:generated.length,totalHonorsDays:22,originalsPreserved:true,publicFolder:dest,exportDir}));

