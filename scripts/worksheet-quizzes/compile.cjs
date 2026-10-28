// Validate the complete teacher-reviewed bank locally. No model API or network use.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),folder=path.join(root,'resources/worksheet-quizzes');
const source=require('../../resources/worksheet-decks/source.json'),targets=require('../../resources/worksheet-quizzes/targets.json'),manifest=require('../../src/data/daily-worksheets.json'),dok=require('./dok.cjs');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const normalize=s=>s.replace(/<[^>]*>/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
assert.equal(source.length,131);assert.equal(manifest.length,131);
const bank=source.map(w=>{
 const label=`Unit ${w.unit} day ${w.day}`,entry=JSON.parse(fs.readFileSync(path.join(folder,`unit-${w.unit}-day-${String(w.day).padStart(2,'0')}.json`),'utf8'));
 assert.equal(entry.source_sha256,hash(w),`${label}: stale worksheet`);assert.equal(entry.title,w.title);assert.deepEqual(entry.criteria,w.criteria);assert.equal(entry.unit,w.unit);assert.equal(entry.day,w.day);
 const sheet=manifest.find(s=>s.unit===w.unit&&s.day===w.day);assert(sheet,`${label}: worksheet manifest`);
 for(const edition of ['cpa','cpa-sei','honors','honors-sei'])assert(fs.existsSync(path.join(root,'public',sheet.files[edition].path)),`${label}: missing ${edition} PDF`);
 for(const track of ['cpa','honors']){
  const qs=entry[track];assert.equal(qs.length,6,`${label}/${track}: six questions`);assert.equal(new Set(qs.map(q=>normalize(q.prompt))).size,6,`${label}/${track}: repeated question`);
  for(const [i,q] of qs.entries()){
   const context=`${label}/${track} Q${i+1}`;assert.equal(q.options.length,4,context);assert.equal(new Set(q.options.map(s=>s.normalize('NFKC').replaceAll('−','-').replace(/\s+/g,' ').trim().toLowerCase())).size,4,`${context}: duplicate options`);assert(Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<4,`${context}: key`);
   assert(q.prompt.length>20&&q.guide.length>15&&q.freshness,`${context}: missing explanation`);assert(!/<(?:img|svg|script)|\b(?:TODO|TBD)\b/i.test(q.prompt),`${context}: missing or unsafe content`);
   assert(targets.some(t=>t.unit_id===`unit-${w.unit}`&&t.slug===q.target_slug),`${context}: unknown target`);
   assert(['Remember','Understand','Apply','Analyze','Evaluate','Create'].includes(q.demand.blooms),`${context}: Bloom`);assert.equal(q.demand.dok,dok[w.unit][w.day][i],`${context}: independently authored DOK`);assert([1,2,3,4].includes(q.demand.dok));assert(q.demand.evidence);
   assert(q.criteria.length&&q.criteria.every(c=>Number.isInteger(c)&&c>=0&&c<w.criteria.length),`${context}: criteria`);
   assert(![...w.cpa,...w.honors].some(item=>normalize(item.prompt)===normalize(q.prompt)),`${context}: copied worksheet prompt`);
  }
  for(let i=0;i<w.criteria.length;i++)assert(qs.filter(q=>q.criteria.includes(i)).length>=2,`${label}: criterion ${i+1} needs two items`);
  assert(qs.some(q=>q.transfer),`${label}: transfer`);assert(new Set(qs.map(q=>q.correct_index)).size>=3,`${label}: answer positions`);
 }
 return entry;
});
const output=JSON.stringify(bank,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path.join(folder,'bank.json'),'utf8'),output,'Compiled bank is stale. Run node scripts/worksheet-quizzes/compile.cjs.');
else fs.writeFileSync(path.join(folder,'bank.json'),output);
console.log(`PASS: ${bank.length} current worksheets, ${bank.length*2} track sets, ${bank.length*12} MC items; four PDF editions each, canonical targets, complete criterion coverage, answer keys, independent demands, fresh prompt checks, and balanced answer positions. Common target checks are shared across tracks; these are not 262 wholly distinct authored sets.`);
