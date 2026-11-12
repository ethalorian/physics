/* Add missing visual supports without changing any pinned packet or original six sheets.
   The original comic sections live in resources/student-choice/unit-1-comics. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'../..'),res=path.join(root,'resources/student-choice'),cat=path.join(root,'src/data/student-choice-binder.json')
const read=f=>fs.readFileSync(f,'utf8'), data=f=>JSON.parse(read(path.join(res,f))), hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const days=data('visual-language-unit-1.json'), cards=data('visual-language-cards.json'), pics=data('visual-language-pictures.json'),css=read(path.join(res,'visual-language.css'))
const all=JSON.parse(read(cat)),base=all.filter(p=>p.version==='layout-1215defe2f22')
assert.equal(base.length,22)
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const labels={B:'Doodle Notes',H:'Frayer Model',K:'Picture Dictionary',CS:'Comic Strip'}
const fig=(key,hidden=false)=>{const svg=pics[key];assert(svg,key);return '<div class="sei-fig">'+(hidden?svg.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,''):svg)+'</div>'}
const key=[['green','speeding up'],['red','slowing down'],['yellow','steady · balanced'],['blue','position · displacement'],['purple','velocity'],['orange','forces']].map(([k,v])=>'<span><i></i> <b>'+k+'</b> '+v+'</span>').join('')
const box=(n,task,draw)=>'<div class="sei-box"><h3>'+esc(n)+'</h3><p>'+esc(task)+'</p><div class="'+(draw?'sei-drawing':'sei-lines')+'"></div></div>'
const share=(stem)=>'<div class="sei-share"><div class="sei-tag">SAY IT TO A PARTNER · THEN WRITE</div>'+esc(stem)+' …<div class="sei-lines"></div></div>'
function sheet(d,k,n,title){
 const x=days[d-1],word=esc(x.term), mini='<div class="sei-case">'+fig(x.picture)+'<div><div class="sei-tag">TODAY’S CASE</div><p>'+esc(x.case)+'</p></div></div>'
 let body=''
 if(k==='B')body=mini+'<div class="sei-grid">'+box('01 · SKETCH AND LABEL',x.draw,true)+box('02 · CHANGE THE PICTURE',x.vary,true)+'</div><div class="sei-prompt"><strong>Annotate your sketches.</strong> Circle the mark that best shows '+word.toLowerCase()+'. Add a label in English or your home language.</div>'+share(x.frame)
 if(k==='H')body='<div class="sei-bands"><div class="sei-band"><b>A</b> · '+esc(d%2 ? x.nonexample : x.example)+'</div><div class="sei-band"><b>B</b> · '+esc(d%2 ? x.example : x.nonexample)+'</div></div><div class="sei-grid">'+box('01 · DEFINITION','What does '+x.term.toLowerCase()+' mean in your own words? Use the notes or start in your home language.',false)+box('02 · CHARACTERISTICS','What must be true? Label a small sketch to show one feature.',true)+box('03 · EXAMPLE','Choose A or B as your example. Sketch it and explain which feature makes it fit.',true)+box('04 · NONEXAMPLE','Explain why the other card does not fit. Change one detail so that it would.',false)+'</div>'+share('I chose card ___ as my example because')
 if(k==='K'){
 const list=cards[d];assert.equal(list.length,6)
 body='<div class="sei-words">'+list.map(w=>'<div class="sei-card"><div class="sei-card-top">'+fig(w.picture)+'<div><h3>'+esc(w.en)+'</h3><span class="sei-trans">'+esc(w.translation)+'</span></div></div><p>'+esc(w.meaning)+'</p><p class="sei-small">My word or label: __________________</p></div>').join('')+'</div><div class="sei-tag">MATCH · WRITE THE ENGLISH WORD UNDER EACH PICTURE</div><div class="sei-match">'+[4,1,3].map(i=>'<div>'+fig(list[i].picture,true)+'______________</div>').join('')+'</div><div class="sei-share"><strong>Use two words to explain the case:</strong> '+esc(x.case)+'<div class="sei-lines"></div></div>'
 }
 return '<section class="page sei-sheet" data-screen-label="Day '+d+' · '+labels[k]+'"><style>'+css+'</style><main class="sei-shell"><div class="sei-lesson"><header class="sei-top"><div class="sei-tag">UNIT 1 · DAY '+d+' · LANGUAGE SUPPORT · '+labels[k].toUpperCase()+'</div><h1>'+esc(title)+'</h1><p>'+({B:'I can draw a change and explain what my marks mean.',H:'I can explain a term by comparing an example with a nonexample.',K:'I can connect each word to a picture and use it to explain this case.'}[k])+'</p></header><div class="sei-name"><span>Name: ___________________</span><span>My home language: ______________</span></div>'+(k==='K'?'':'<div class="sei-small"><strong>'+word+'</strong> · '+esc(x.es)+' (ES) · '+esc(x.pt)+' (PT)</div>')+body+'</div><div class="sei-key"><b>UNIT 1 COLOR CODE</b>'+key+'<span>pencil · everything else</span></div><footer class="sei-foot">STUDENT CHOICE BINDER · OPTION '+n+' · STYLE '+k+' · '+labels[k].toUpperCase()+' · FILE WITH DAY '+d+' NOTES · 3-HOLE PUNCH LEFT</footer></main></section>'
}
const section=html=>html.match(/<section\b[\s\S]*?<\/section>/)[0]
const stage=base.map(p=>{
 const extra=[],add=(k,title,html)=>extra.push({k,title,html}),dd=String(p.day).padStart(2,'0'),comic=path.join(res,'unit-1-comics','day-'+dd+'.html')
 {assert(fs.existsSync(comic),'Missing original comic for day '+dd);let h=read(comic);assert(h.includes('STYLE CS'));let title=h.match(/>\s*(Comic:[^<>]+)</i)?.[1]||'Comic Strip';h=h.replace(/OPTION [1-6] · STYLE CS/g,'OPTION 7 · STYLE CS').replace(/<section class="page"/,'<section data-layout="practice" class="page"');add('CS',title.replace(/&amp;/g,'&'),h)}
 for(const k of ['B','H','K'])if(!p.options.some(o=>o.style===k)){const title=labels[k]+' · '+days[p.day-1].term.toLowerCase(),n=p.options.length+extra.length+1;add(k,title,sheet(p.day,k,n,title))}
 return {p,extra}
})
const version='visual-sei-'+hash(JSON.stringify(stage.map(({p,extra})=>[p,extra]))).slice(0,12),dir='/student-choice-pages/unit-1/'+version, out=path.join(root,'public',dir)
fs.mkdirSync(out,{recursive:true})
const newest=stage.map(({p,extra})=>{
 const options=p.options.map(o=>({...o,sei:o.sei||['B','H','K'].includes(o.style)}))
 const src=read(root+'/public'+p.options[0].previewPath)
 for(const {k,title,html} of extra){const n=options.length+1,name='day-'+String(p.day).padStart(2,'0')+'-option-'+n+'.html';const preview=src.replace(/<title>[^<]*<\/title>/,'<title>'+esc(title)+'</title>').replace(section(src),()=>html);fs.writeFileSync(path.join(out,name),preview);options.push({title,path:dir+'/'+name,previewPath:dir+'/'+name,style:k,sei:k!=='CS',sha256:hash(preview)})}
 assert(options.length<=10&&['B','H','K'].every(k=>options.filter(o=>o.style===k).length===1))
 return {...p,version,options}
})
fs.writeFileSync(cat,JSON.stringify([...newest,...all.filter(p=>p.version!==version)],null,2)+'\n')
console.log(version,newest.map(p=>p.options.length).join(','))
