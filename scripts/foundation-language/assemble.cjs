// Derive readable companions from the same translated nodes as the live slides.
// No network or student data. All other authored passages must be reviewed first.
const fs=require('node:fs'),path=require('node:path'),p5=require('parse5');
const companion=require('../foundation-groups/slide-language.cjs').companion;
const words=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen'];
const normalize=s=>s.replace(/\s+/g,' ').trim();
function companionSources(){return new Set(words.flatMap(w=>JSON.parse(fs.readFileSync(`src/data/foundations/day-${w}-slides.json`)).map(s=>s.text)))}
function assemble(saved){
 const result={...saved};
 words.forEach((word,i)=>{
  const slides=JSON.parse(fs.readFileSync(`src/data/foundations/day-${word}-slides.json`));
  const html=fs.readFileSync(`public/foundations/day-${i+1}-runtime-v1/day-${i+1}.dc.html`,'utf8');
  const sections=[];
  function findSections(n){if(n.tagName==='section')sections.push(n);for(const child of n.childNodes||[])findSections(child);}
  findSections(p5.parse(html));
  if(sections.length!==slides.length)throw Error('Companion slide count changed');
  function rewrite(n,skip=false){
   skip ||= ['script','style','code','pre','math'].includes(n.tagName);
   if(!skip&&n.nodeName==='#text'){const key=normalize(n.value);if(Object.hasOwn(saved,key))n.value=n.value.replace(n.value.trim(),saved[key]);}
   if(!skip)for(const a of n.attrs||[])if(['alt','title','aria-label'].includes(a.name)&&Object.hasOwn(saved,normalize(a.value)))a.value=saved[normalize(a.value)];
   for(const child of n.childNodes||[])rewrite(child,skip);
  }
  sections.forEach((tree,j)=>{rewrite(tree);result[slides[j].text]=companion(tree)});
 });
 return result;
}
function write(file,data){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data));fs.renameSync(tmp,file)}
module.exports={assemble,companionSources};
if(require.main===module){
 const root=path.resolve(process.argv.find(a=>a.startsWith('--cache='))?.slice(8)||'node_modules/.cache/foundation-language');
 const data=require('../../src/data/foundations/language-sources.json'),derived=companionSources();
 const all=[...new Set(Object.values(data).flatMap(d=>d.texts))];
 for(const locale of ['es','pt-BR']){
  const saved=JSON.parse(fs.readFileSync(path.join(root,locale+'.json'))),missing=all.filter(t=>!derived.has(t)&&!saved[t]);
  if(missing.length)throw Error(locale+': '+missing.length+' authored passages still need translation');
  const completed=assemble(saved);fs.mkdirSync('public/foundations/languages',{recursive:true});
  for(const [day,{version,texts}]of Object.entries(data))write(`public/foundations/languages/${day}.${locale}.json`,{version,locale,map:Object.fromEntries(texts.map(t=>[t,completed[t]]))});
  console.log(locale+': complete dictionaries for nine lessons, including derived slide companions');
 }
}
