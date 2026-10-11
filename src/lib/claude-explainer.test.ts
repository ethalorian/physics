import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import manifest from '@/data/explainers/claude-manifest.json'
import { physicsExplainerBlocks } from '@/data/explainers/physics-explainers'
import { applyTeachingToolCommand, initialTeachingTool } from './teaching-tool-spec'
import { validClaudeSnapshot } from './claude-explainer'

test('all six deployed explainers and runtime preserve the source bytes',()=>{
 for(const e of manifest){const source=fs.readFileSync('src/data/explainers/claude-source/'+e.file),deployed=fs.readFileSync('public'+e.src);assert.equal(crypto.createHash('sha256').update(source).digest('hex'),e.sha256);assert.deepEqual(deployed,source)}
 assert.deepEqual(fs.readFileSync('public/explainers/claude/support.js'),fs.readFileSync('src/data/explainers/claude-source/support.js'))
})
test('original controls are finite authored state, never arbitrary code or grading data',()=>{
 const block=physicsExplainerBlocks().find(b=>b.id==='explainer-vectors')!,old=initialTeachingTool(block)
 const claude={offset:.25,values:{path:'outback',s:56,playing:false,astV:8,pushV:1,pushDeg:90,sorts:{},answers:{'0':1}}}
 assert.ok(validClaudeSnapshot('vectors',claude));const next=applyTeachingToolCommand(block,old,{block_id:block.id,state:{frame:2,claude}})!
 assert.deepEqual(next.state.claude,claude);assert.equal(old.state.claude,undefined)
 for(const bad of [{...claude,offset:Infinity},{...claude,offset:2},{...claude,values:{...claude.values,path:'bad'}},{...claude,values:{...claude.values,s:NaN}},{...claude,values:{...claude.values,answers:{'0':'<script>'}}},{...claude,values:{...claude.values,grade:3}}])assert.equal(applyTeachingToolCommand(block,next,{block_id:block.id,state:{claude:bad}}),null)
 assert.equal(applyTeachingToolCommand(block,next,{block_id:block.id,reset:true})!.state.claude,undefined)
 assert.equal(applyTeachingToolCommand(block,next,{block_id:block.id,state:{frame:99}}),null)
})
