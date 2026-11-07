const fs=require('node:fs'),assert=require('node:assert/strict');
const {sources}=require('./source.cjs');
const {protect}=require('./translate.cjs');
const source=sources();
assert.deepEqual(source,require('../../src/data/foundations/language-sources.json'),'Regenerate the English language sources');
for(const [day,{version,texts}]of Object.entries(source))for(const locale of ['es','pt-BR']){
 const file=`public/foundations/languages/${day}.${locale}.json`;
 assert.ok(fs.existsSync(file),'Missing language file: '+file);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(data.version,version,'Stale translation: '+file);assert.equal(data.locale,locale);
 assert.deepEqual(Object.keys(data.map).sort(),texts,'Incomplete authored-text coverage: '+file);
 for(const text of texts){
  const translated=data.map[text];
  assert.equal(typeof translated,'string');assert.ok(translated.trim());
  assert.ok(!/⟦K\d+⟧|__BEGIN_S|__END_S/.test(translated),'Unrestored translation token');
  assert.ok(!/<\/?[a-z][^>]*>/i.test(translated),'Unexpected HTML');
  assert.deepEqual(protect(translated).values.sort(),protect(text).values.sort(),`Changed math, values, links or formatting in ${file}: ${text}`);
 }
}
console.log('All nine foundations have complete Spanish and Brazilian Portuguese dictionaries for the current English text.');
