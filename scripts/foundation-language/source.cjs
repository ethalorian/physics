// Canonical authored text only. Never reads student work or database records.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),p5=require('parse5');
require('tsx/cjs');
const {foundationSectionText,foundationQuestionText,getFoundationCheckpoints}=require('../../src/lib/interactive-assignments/foundations/checkpoints.ts');
const {foundationRole}=require('../../src/lib/interactive-assignments/foundations/groups.ts');
const ts=require('typescript');
const ui=[];
for(const name of ['FoundationSlides','FoundationExchange','LessonActivity','QuestionResponse','AssignmentWorkspace','AssignmentAvatar','AssignmentChecklist']){const file='src/components/interactive-assignments/'+name+'.tsx',text=fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,text,99,true,ts.ScriptKind.TSX);function walk(n){if(ts.isCallExpression(n)&&n.expression.getText(sf)==='t'){for(const a of n.arguments){function literals(x){if(ts.isStringLiteral(x))ui.push(x.text);ts.forEachChild(x,literals)}literals(a)}}ts.forEachChild(n,walk)}walk(sf);}
const days=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen'];
const normalize=s=>s.replace(/\s+/g,' ').trim();
function sources(){
 const result={};
 days.forEach((word,index)=>{
  const key='day-'+word,strings=new Set(),add=s=>{if(typeof s==='string'&&/[a-zA-Z]{2}/.test(s)&&!s.includes('{{'))strings.add(s)};
  const lesson=Object.values(require('../../src/lib/interactive-assignments/foundations/'+key+'.ts')).find(x=>x?.sections);
  add(lesson.title);
  lesson.sections.forEach((s,i)=>{[s.title,s.stop,s.learn,foundationSectionText(i,s.learn,true,key)].forEach(add);s.questions.forEach(q=>{[q.prompt,q.hint,q.explanation,...(q.options||[]),...Object.values(foundationQuestionText(q,true))].forEach(add)})});
  getFoundationCheckpoints(key).forEach(c=>{[c.title,...c.roles,...c.prompts,c.discuss,c.reply,c.reflection,...Object.values(c.solo)].forEach(add)});
  for(let size=2;size<=4;size++)for(let seat=0;seat<size;seat++){let r=foundationRole(seat,size,0);[r.title,r.description,r.secondary].forEach(add)}
  const slides=JSON.parse(fs.readFileSync('src/data/foundations/'+key+'-slides.json','utf8'));
  const guides=require('../../src/data/foundations/reading-guides.json')[key];
  if(guides){
   for(const slide of slides){if(!guides[slide.title])throw Error('Missing reading guide for '+key+' / '+slide.title);add(guides[slide.title]);}
  }
  slides.forEach(s=>{add(s.title);add(s.text);add(s.teachingStep)});
  const html=fs.readFileSync(`public/foundations/day-${index+1}-runtime-v1/day-${index+1}.dc.html`,'utf8');
  function walk(n,inSlide=false,skip=false){inSlide ||= n.tagName==='section';skip ||= ['script','style','code','pre','math'].includes(n.tagName);if(inSlide&&!skip){if(n.nodeName==='#text')add(normalize(n.value));for(const a of n.attrs||[])if(['alt','title','aria-label'].includes(a.name))add(normalize(a.value));}for(const ch of n.childNodes||[])walk(ch,inSlide,skip);}
  walk(p5.parse(html));
  ui.forEach(add);
  ['Start','Pause','Resume','Restart','Reset','Show answer','Hide answer','Time is up!','Done'].forEach(add);
  const texts=[...strings].sort();result[key]={version:crypto.createHash('sha256').update(JSON.stringify(texts)).digest('hex').slice(0,16),texts};
 });return result;
}
module.exports={sources,normalize};
if(require.main===module){const data=sources();fs.writeFileSync('src/data/foundations/language-sources.json',JSON.stringify(data));fs.writeFileSync('src/data/foundations/language-index.json',JSON.stringify(Object.fromEntries(Object.entries(data).map(([key,v])=>[key,{version:v.version,count:v.texts.length}]))));console.log(Object.fromEntries(Object.entries(data).map(([key,v])=>[key,{count:v.texts.length,characters:v.texts.join('').length}])));}
