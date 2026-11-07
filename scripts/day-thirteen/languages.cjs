const fs=require('node:fs'),assert=require('node:assert/strict');
const {assemble}=require('../foundation-language/assemble.cjs');
const rows=fs.readFileSync('resources/foundations/day-thirteen/copy.txt','utf8').trim().split('\n').map(line=>line.split('|'));
const {texts,version}=require('../../src/data/foundations/language-sources.json')['day-thirteen'];
for(const [i,locale] of ['es','pt-BR'].entries()){
 const dir='public/foundations/languages/';
 const map=Object.assign({},...fs.readdirSync(dir).filter(f=>!f.startsWith('day-thirteen.')&&f.endsWith('.'+locale+'.json')).map(f=>JSON.parse(fs.readFileSync(dir+f)).map));
 for(const [,en,es,pt] of rows)map[en]=i===0?es:pt;
 for(const [source,pair] of Object.entries(require('../../resources/foundations/day-thirteen/slide-translations.json')))map[source]=pair[i];
 const complete=assemble(map);
 for(const text of texts)assert.ok(complete[text],text);
 fs.writeFileSync(dir+'day-thirteen.'+locale+'.json',JSON.stringify({locale,version,map:Object.fromEntries(texts.map(t=>[t,complete[t]]))}));
}
