const fs=require('fs'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'../..'),parse5=require('parse5');
const pages=JSON.parse(fs.readFileSync(root+'/resources/student-choice/unit-1-layout-pages.json')),adjustments=JSON.parse(fs.readFileSync(root+'/resources/student-choice/unit-1-layout-adjustments.json'));
const css=fs.readFileSync(root+'/resources/student-choice/print-layout.css','utf8');
const all=(n,tag)=>[...(n.tagName===tag?[n]:[]),...(n.childNodes||[]).flatMap(c=>all(c,tag))];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function set(n,k,value){let a=n.attrs.find(a=>a.name===k);if(a)a.value=value;else n.attrs.push({name:k,value});}
const content=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(content).join('');
// Deliberate label placements where a shared baseline matters.
adjustments.push({kind:'honors',day:5,diagram:0,viewBox:'0 0 616 262',moves:[...Array.from({length:6},(_,i)=>({textIndex:i+2,dy:18,dx:0})),{textIndex:9,dx:0,dy:22},{textIndex:10,dx:0,dy:25}]});
let walk=adjustments.find(p=>p.kind==='practice'&&p.day===14&&p.option===4&&p.diagram===1);walk.moves.push({textIndex:1,dx:0,dy:-34});
adjustments.find(p=>p.kind==='practice'&&p.day===4&&p.option===4&&p.diagram===7).moves.push({textIndex:0,dx:-3,dy:0});
adjustments.find(p=>p.kind==='practice'&&p.day===17&&p.option===4&&p.diagram===1).moves.push({textIndex:1,dx:0,dy:5});
const dest=process.argv[2];assert(dest,'Pass a dedicated output directory');fs.mkdirSync(dest,{recursive:true});let updated=[],notes=[],practices=[],heads={};
for(const page of pages){
 const [kind,dayS,optS]=page.id.split('-'),day=Number(dayS),option=optS?Number(optS):undefined;
 const original=fs.readFileSync(root+'/public'+page.path,'utf8'),section=original.match(/<section\b[\s\S]*?<\/section>/)[0],tree=parse5.parseFragment(section),s=all(tree,'section')[0],svgs=all(s,'svg');
 const before=content(tree);set(s,'data-layout',kind==='practice'?'practice':'notes');
 for(const a of adjustments.filter(a=>a.kind===kind&&a.day===day&&a.option===option)){
  const svg=svgs[a.diagram],old=attr(svg,'viewBox').split(/[ ,]+/).map(Number),nv=a.viewBox.split(' ').map(Number),texts=all(svg,'text');set(svg,'viewBox',a.viewBox);
  for(const m of a.moves){const t=texts[m.textIndex];if(m.text)assert.equal(content(t),m.text);set(t,'transform',`translate(${m.dx} ${m.dy})`+(attr(t,'transform')?' '+attr(t,'transform'):''));}
  if(old[2]<=130&&nv[3]>old[3]){
   const parent=svg.parentNode,style=attr(parent,'style')||'',match=style.match(/(?:^|;)height:([\d.]+)px/);
   if(match)set(parent,'style',style.replace(/(^|;)height:[\d.]+px/,`$1height:${Math.ceil(Number(match[1])*nv[3]/old[3])}px`));
  }
 }
 assert.equal(content(tree),before,'Lesson content changed: '+page.id);
 const revised=parse5.serialize(tree),base=path.posix.dirname(page.path)+'/',head=original.slice(0,original.indexOf(section)).replace('<head>',`<head><base href="${base}">`).replace('</head>',`<style id="student-choice-print-layout">${css}</style></head>`),tail='</doc-page></body></html>';
 fs.writeFileSync(dest+'/'+page.id+'.html',head+revised+tail);heads[kind]=head;
 (kind==='practice'?practices:notes).push({kind,day,option,section:revised});updated.push({...page,path:'/repaired/'+page.id+'.html'});
}
fs.writeFileSync(dest+'/pages.json',JSON.stringify(updated,null,2));
for(const kind of ['cpa','honors','practice'])fs.writeFileSync(dest+'/'+kind+'-all.html',heads[kind]+(kind==='practice'?practices:notes.filter(n=>n.kind===kind)).map(n=>n.section).join('\n')+'</doc-page></body></html>');
fs.writeFileSync(dest+'/notes-all.html',heads.honors+notes.map(n=>n.section).join('\n')+'</doc-page></body></html>');
console.log(JSON.stringify({pages:updated.length,notes:notes.length,practice:practices.length,allTextsPreserved:true}));
