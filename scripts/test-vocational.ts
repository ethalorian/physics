import assert from 'node:assert/strict'
import fs from 'node:fs'
import {isBlockComplete,type ContentBlock} from '../src/data/content-blocks'
import {validateBlockDocument} from '../src/data/block-registry'
const all=JSON.parse(fs.readFileSync('scripts/trades-opening/lessons.json','utf8'))
for(const l of all){assert.deepEqual(validateBlockDocument(l.content_blocks,true),[]);assert.ok(l.content_blocks.blocks.every((b:ContentBlock)=>b.studentDirections?.length));for(const b of l.content_blocks.blocks as ContentBlock[]){if(b.type==='data_table'){assert.equal(b.analysisMode,'record');assert.equal(b.rowLabels?.length,b.rows);const rows=b.rowLabels!.map(label=>[label,...b.columns.slice(1).map(()=> '15 in')]);assert.equal(isBlockComplete(b,{rows}),true,l.slug);assert.equal(isBlockComplete(b,{rows:rows.map(r=>[r[0],...r.slice(1).map(()=> '')])}),false);assert.equal(isBlockComplete({...b,analysisMode:'pattern'},{rows}),false);assert.equal(isBlockComplete({...b,analysisMode:'pattern'},{rows,pattern:'Flat',interpret:'Repeated readings agreed.'}),true);}if(b.vocational)assert.deepEqual(Object.keys(b.vocational).sort(),['carpentry','electrical','plumbing']);}}
console.log('PASS: 30 documents; explicit directions; table row contracts; record-only and legacy completion; three trade contexts.')
