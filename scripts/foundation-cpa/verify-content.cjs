const fs=require('fs'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),base='src/data/foundations/',bank=read(base+'cpa-questions.json'),languages=read(base+'cpa-languages.json'),mapping=read(base+'teaching-guide-map.json'),topics=read(base+'teaching-guide-topics.json');
assert.deepEqual(Object.keys(mapping).sort(),Object.keys(read(base+'language-index.json')).sort());
assert.deepEqual(Object.keys(bank).sort(),Object.keys(languages).sort());
function numbers(text){return [...new Set(text.replace(/^\d+\. /gm,'').match(/[+−-]?\d+(?:[.,]\d+)*/g)??[])].sort()}
for(const [id,q]of Object.entries(bank)){
 assert(q.prompt&&q.explanation&&q.blooms&&[1,2].includes(q.dok),id);
 for(const locale of ['es','pt-BR']){const value=languages[id][locale];assert(value?.trim(),id+' '+locale);assert.equal((value.match(/\*\*/g)??[]).length%2,0,id+' emphasis');for(const n of numbers(q.prompt))assert(numbers(value).includes(n),id+' lost '+n+' in '+locale)}
 for(const [,url]of q.prompt.matchAll(/\]\((\/[^)]+)\)/g))assert(fs.existsSync('public'+url),id+' missing figure');
}
for(const [id,topic]of Object.entries(topics))for(const field of ['learn','check','answer'])for(const loc of ['es','pt-BR'])for(const n of numbers(topic[field].en))assert(numbers(topic[field][loc]).includes(n),id+' '+field+' lost '+n+' in '+loc);
let slides=0;
for(const [key,entries]of Object.entries(mapping)){
 const original=read(base+key+'-slides.json');assert.equal(original.length,entries.length,key);
 original.forEach((slide,i)=>{assert.equal(entries[i].number,slide.number);assert.equal(entries[i].title,slide.title,key+' needs guide review');const topic=topics[entries[i].topic];assert(topic,key+' unknown topic');for(const locale of ['en','es','pt-BR'])for(const field of ['learn','check','answer'])assert(topic[field][locale]?.trim(),key+' '+locale+' '+field);slides++});
}
console.log(`${Object.keys(bank).length} CPA questions translated; ${slides} slide guides aligned in all three languages.`);

const noteExamples = read(base + 'binder-examples.json');
assert.deepEqual(Object.keys(noteExamples).sort(), Object.keys(mapping).sort());
const checkedDays = new Set();
for (const [key, example] of Object.entries(noteExamples)) {
 const source = read(base + key + '-source.json');
 assert.equal(mapping[key].find(slide => slide.number === example.slide)?.title, example.slideTitle, key + ' moved its note example');
 assert.ok(source.file.includes('Day ' + example.day + ' '), key + ' day mismatch');
 assert.ok(!checkedDays.has(example.day), key + ' duplicates a binder day');
 checkedDays.add(example.day);
 assert.ok([1, 2, 3].includes(example.stop), key + ' missing discussion stop');
 for (const edition of ['cpa', 'honors']) {
  const filename = edition + '-' + String(example.day).padStart(2, '0') + '.json';
  const lesson = read('public/student-choice-pages/unit-1/interactive-v1/' + filename);
  assert.equal(lesson.edition, edition);
  assert.ok(lesson.sections[example.section]?.text.trim(), key + ' missing note section');
  const prompt = example[edition];
  for (const locale of ['en', 'es', 'pt-BR']) {
   assert.ok(prompt[locale]?.trim(), key + ' missing ' + edition + ' ' + locale);
   assert.deepEqual(numbers(prompt[locale]), numbers(prompt.en), key + ' quantities differ in ' + locale);
  }
 }
}
console.log(checkedDays.size + ' Foundation days linked to the matching CPA and Honors note sections.');
