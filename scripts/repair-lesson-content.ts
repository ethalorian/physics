/**
 * Curriculum-only repair. Dry-run is default; --apply requires service credentials.
 * Usage: npx tsx scripts/repair-lesson-content.ts [--input snapshot.json] [--output dir] [--apply]
 * Apply uses snapshot timestamps AND content equality, journals every write, and stops on conflict.
 * Rollback: --rollback /path/to/applied.json (also requires --apply).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { validateBlockDocument } from '../src/data/block-registry'
import { seiLint } from '../src/lib/sei'
import type { BlockDocument, ContentBlock, SeiScaffold } from '../src/data/content-blocks'
import { BLOCK_SUPPORT, LESSON_SUPPORT, getSupport, transferMap, type SupportDiagram } from './lesson-repair/support-catalog'

interface LessonRow { id:string; slug:string; title:string; unit_id:string|null; published:boolean; visibility_track:string|null; content_blocks:BlockDocument|null; updated_at:string|null }
interface Change { blockId:string; action:string; detail:string }
interface Plan { before:LessonRow; after:LessonRow; changes:Change[]; errors:string[] }
interface Applied { id:string; slug:string; before:BlockDocument|null; after:BlockDocument|null; beforeUpdatedAt:string|null; afterUpdatedAt:string }
const args=process.argv.slice(2)
const arg=(name:string, fallback:string)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]??fallback}
const input=arg('--input','/private/tmp/lesson-repair-before.json')
const output=arg('--output','/private/tmp/lesson-content-repair')
const assetDir=path.resolve('public/lesson-support')
const apply=args.includes('--apply')
const assets=new Map<string,SupportDiagram>()
const supportedCapture=new Set(['question','exit_ticket','observation','sentence_frame','gewa'])
// These authoring references were checked against the lesson topic, not chosen by distance.
const REVIEWED_REFERENCES:Record<string,string>={
  "pp-w01-d2": "w01d2-sim2",
  "pp-w01-d3": "w01d3-sim1",
  "u1-d04": "bl2gvt",
  "u1-d06": "bl3vec",
  "u1-d07": "bgraph01",
  "u1-d10": "b6",
  "u1-d11": "b6",
  "u1-d12": "bl6fbd",
  "u1-d14": "bl7ar",
  "u2-d01": "b7",
  "u2-d07": "b4",
  "u2-d08": "b7",
  "u2-d09": "b7",
  "u2-d10": "b6",
  "u2-d15": "b5",
  "u3-d01": "b6",
  "u3-d03": "b7",
  "u3-d04": "b6",
  "u3-d05": "b7",
  "u3-d06": "b7",
  "u3-d07": "b7",
  "u4-d01": "b6",
  "u4-d06": "b7",
  "u4-d08": "b5",
  "u4-d11": "b6",
  "u4-d13": "b7",
  "u4-d17": "b6",
  "u4-d20": "b7",
  "u5-d04": "b6",
  "u5-d09": "b6",
  "u5-d10": "b6",
  "u5-d11": "b5",
  "u6-d02": "b6",
  "u6-d15": "b4",
  "u6-d17": "b5",
  "u7-d16": "b6",
  "u7-d17": "b4"
}
const visualTypes=new Set(['figure','diagram','graph','sim_embed','animation_3d'])
const words=(value:string)=>new Set(value.toLowerCase().match(/[a-z]{4,}/g)?.filter(w=>!new Set(['this','that','what','which','your','with','from','then','when','have','will','show','does','each','about','because','write','their','there','them','into','before','after','same','sketch','draw','explain']).has(w))??[])
const blockText=(b:ContentBlock)=>Object.entries(b).filter(([k,v])=>typeof v==='string'&&['prompt','patternPrompt','interpretPrompt','instruction','title','alt','caption','statement','simulationSlug','animationSlug','frame'].includes(k)).map(([,v])=>v).join(' ') + (b.type==='question'&&typeof b.question==='object'?JSON.stringify(b.question):'')
function hasRealVisual(b:ContentBlock):boolean { return visualTypes.has(b.type) || (b.type==='sketch' || b.type==='lab_notebook') && Boolean(b.backgroundDiagram) }
function compatible(source:ContentBlock,capture:ContentBlock):boolean {return !source.visibilityTrack || source.visibilityTrack===capture.visibilityTrack}
function chooseReference(blocks:ContentBlock[],capture:ContentBlock,lessonSlug:string):ContentBlock|undefined {
 const candidates=blocks.filter(b=>b.id!==capture.id&&hasRealVisual(b)&&compatible(b,capture)&&(!b.targetId||!capture.targetId||b.targetId===capture.targetId))
 const query=words(blockText(capture))
 const reviewed=REVIEWED_REFERENCES[lessonSlug]; const selected=candidates.find(b=>b.id===reviewed); if(selected)return selected;
 return candidates.map(b=>({b,score:[...words(blockText(b))].filter(w=>query.has(w)).length+(b.targetId&&b.targetId===capture.targetId?10:0)+(b.type==='figure'?0.2:0)})).filter(candidate=>candidate.score>=2).sort((a,b)=>b.score-a.score)[0]?.b
}
function supportAsset(key:string,diagram:SupportDiagram):SeiScaffold['visual'] {assets.set(key,diagram);return {src:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagram.svg)}`,alt:diagram.alt}}
const exits:Record<string,{target:string;prompt:string;frame:string;support?:string}>= {
 'pp-w00-d2':{target:'pp.w00.predict-lock',prompt:'Use your detector trace from today. Describe one part where you walked and one part where you stopped. Cite a feature of the line for each, and state one prediction you would lock before a second walk.',frame:'When I ___, the line ___. When I stopped, ___. Before the next walk I predict ___.',support:'walking'},
 'pp-w00-d3':{target:'pp.w00.timeline',prompt:'Use timeline entry #1. State what your team planned, what actually happened, and one change you will make next time because of that evidence.',frame:'We planned ___. What happened was ___. Next time we will ___ because ___.',support:'timeline'},
 'pp-w01-d1':{target:'pp.w01.read-graph',prompt:'Choose one segment of your actual walking graph. Describe direction and whether you were stopped or moving, using the segment’s slope as evidence. Compare it with your prediction.',frame:'In segment ___, the slope was ___. I was ___. My prediction matched/differed because ___.',support:'walking'},
 'pp-w01-d2':{target:'pp.w01.a-from-slope',prompt:'Choose one run you checked in the simulation today. State your prediction before checking, identify one velocity–time graph feature, and explain what that feature shows about acceleration.',frame:'I predicted ___. The velocity–time graph showed ___. Its slope means ___.'},
 'pp-w01-d3':{target:'pp.w01.v-from-slope',prompt:'From one of today’s graph problems, show the two graph readings you used and calculate a velocity from slope OR a displacement from area. Include units and name which graph quantity supports your answer.',frame:'On the ___–time graph I used ___. My slope/area calculation is ___. It represents ___, in units of ___.'},
 'pp-w01-d4':{target:'pp.w01.sketch-first',prompt:'Use your predicted cart graph and the detector’s actual trace. Identify one specific match or mismatch, cite the relevant segment, and describe a revised prediction for a new push.',frame:'In segment ___ I predicted ___. The detector showed ___. For the next push I predict ___ because ___.',support:'walking'},
 'tu1-s05':{target:'tr.u1.choose-inst',prompt:'Use the five readings on your paper packet. Report the highest and lowest readings with units and their spread. State the tolerance you claim on one dimension and justify the instrument you would use.',frame:'My high reading was ___ and my low was ___, so the spread was ___. I claim a tolerance of ___ and would use ___ because ___.',support:'tolerance'},
 'tu1-s10':{target:'tr.u1.fits',prompt:'Use your measured wall or block section and service from the paper packet. Report the actual available dimension and actual service dimension, show the clearance calculation, and state whether it fits. Include your drawing scale and one scale-check measurement.',frame:'The available space is ___; the actual service dimension is ___. Clearance = ___. It fits/does not fit because ___. My drawing scale is ___, checked by ___.',support:'fit'},
 'tu2-s05':{target:'tr.u2.square-check',prompt:'Use the rectangle you laid out and recorded on paper. Report both measured diagonals and their difference. Explain what that evidence tells you about square and why correct side lengths alone were not enough.',frame:'My diagonals were ___ and ___, differing by ___. This tells me ___. Side lengths alone cannot show ___ because ___.',support:'square'},
 'tu2-s10':{target:'tr.u2.plan-slope',prompt:'Use today’s pipe-run drawings. State the run length, slope with units, and both end elevations. Show that their elevation difference agrees with the total fall. Name one detail your partner needed from the section that the plan alone could not show.',frame:'For a run of ___ at ___, the total fall is ___. The elevations are ___ and ___. The section was needed to show ___.',support:'slope'},
}
function scaffoldFrames(b:ContentBlock):NonNullable<SeiScaffold['frames']> {
 const legacy='frame'in b&&typeof b.frame==='string'?b.frame:'patternFrame'in b&&typeof b.patternFrame==='string'?b.patternFrame:undefined
 const p=blockText(b)
 const starter=legacy??(b.type==='observation'?'I observed ___ when ___ changed. The evidence is ___.':b.type==='gewa'?'Given: ___ . I chose ___ because ___ . My work is ___ . My answer with units is ___.':b.type==='question'?'I chose ___ because the evidence shows ___.':/reflection|confuses|grow|struggle|plan:/i.test(p)?'I can now ___ . My evidence from today is ___ . Next I will ___ because ___.':/compute|calculate|find|how much|how many|show.*work|what.*speed/i.test(p)?'The given values are ___ . I use ___ . My calculation is ___ . The answer is ___ with units ___.':'My claim is ___ . My evidence is ___ . This supports my claim because ___.')
 return [{level:1,text:starter},{level:2,text:b.type==='gewa'?'My equation applies because ___ . The units and sign of ___ mean ___.':'The evidence ___ supports ___ because ___.'},{level:3,text:'My evidence supports ___ because ___.'}]
}
function repair(row:LessonRow):Plan {
 const after=structuredClone(row),changes:Change[]=[]
 const note=(b:ContentBlock|undefined,action:string,detail:string)=>changes.push({blockId:b?.id??'',action,detail})
 if(!after.content_blocks)return {before:row,after,changes,errors:[]}
 const doc=after.content_blocks
 if(doc.schemaVersion===undefined){doc.schemaVersion=1;note(undefined,'schema','Added missing schemaVersion: 1; no block reshaping.')}
 for(const b of doc.blocks){const raw=b as unknown as Record<string,unknown>;if(b.type==='callout'&&!b.markdown&&typeof raw.body==='string'&&raw.body.trim()){b.markdown=raw.body;note(b,'callout','Copied existing body verbatim into markdown, retaining body.')}}
 if(after.published){
  const extra=exits[row.slug]
  if(extra&&!doc.blocks.some(b=>b.id==='audit-evidence-exit')){
   const b:ContentBlock={id:'audit-evidence-exit',type:'exit_ticket',capture:true,targetId:extra.target,prompt:extra.prompt,frame:extra.frame,sei:{frames:[{level:1,text:extra.frame}],modes:['text','sketch']}}
   if(extra.support)b.sei!.visual=supportAsset(extra.support,getSupport(extra.support))
   doc.blocks.push(b);note(b,'exit','Added an individual close-out tied to the actual graph/measurement/paper work; original work and self-ratings retained.')
  }
  for(const b of doc.blocks){
   if(!supportedCapture.has(b.type)||(b.type==='sentence_frame'&&!b.capture))continue
   const prior=JSON.stringify(b.sei)
   b.sei={...b.sei}
   let diagram:SupportDiagram|undefined
   if(!b.sei.visual&&!b.sei.visualBlockId){
    const override=BLOCK_SUPPORT[`${row.slug}/${b.id}`]
    const candidate=override?undefined:chooseReference(doc.blocks,b,row.slug)
    if(candidate){b.sei.visualBlockId=candidate.id;note(b,'visual-reference',`Uses ${candidate.id} (${candidate.type}): ${blockText(candidate).slice(0,200)}.`)}
    else {
     let key=override??LESSON_SUPPORT[row.slug]
     if(!key&&/Transfer Task/i.test(row.title)){const unit=Number(row.slug.match(/^u(\d+)/)?.[1]);if(unit>=2&&unit<=7){key=`unit-${unit}-transfer-map`;diagram=transferMap(unit)}}
     if(key){diagram??=getSupport(key);b.sei.visual=supportAsset(key,diagram);note(b,'authored-visual',`${key}: ${diagram.alt}`)}
     else if(b.type==='gewa'){/* Existing structured G/E/W/A math is a representation; no invented art. */}
     else note(b,'unresolved','No compatible authored representation found; requires editorial review.')
    }
   }
   if(!b.sei.frames?.length)b.sei.frames=scaffoldFrames(b)
   const targetTerms=words(b.targetId?.replace(/[.\-]/g,' ')??'')
   const bank=diagram?.words??[...targetTerms].slice(0,6)
   if(!b.sei.wordBank?.length&&bank.length)b.sei.wordBank=bank
   if(!b.sei.modes?.length)b.sei.modes=b.type==='observation'||b.type==='gewa'?['text']:b.type==='question'&&typeof b.question==='object'&&b.question&&'options'in b.question?['choice']:['text','sketch']
   if(JSON.stringify(b.sei)!==prior)note(b,'scaffold','Added support data only; original assessment prompt and rubric unchanged.')
  }
 }
 const errors=validateBlockDocument(doc,after.published).map(e=>`${e.blockId??'lesson'}: ${e.message}`)
 if(after.published)errors.push(...seiLint(doc.blocks).filter(e=>e.severity==='error').map(e=>`${e.blockId||'lesson'} ${e.rule}: ${e.message}`))
 // Every existing block remains in the same relative order with every existing field retained.
 const original=row.content_blocks?.blocks??[]
 for(const b of original){const next=doc.blocks.find(n=>n.id===b.id);if(!next)throw new Error(`Removed block ${row.slug}/${b.id}`);for(const [key,value] of Object.entries(b)){if(key==='sei'||(b.type==='callout'&&key==='markdown'&&!value))continue;if(!isDeepStrictEqual((next as unknown as Record<string,unknown>)[key],value))throw new Error(`Changed original ${row.slug}/${b.id}.${key}`)}}
 if(row.published!==after.published||row.slug!==after.slug)throw new Error('Changed lesson identity or publication')
 return {before:row,after,changes,errors}
}
function client(){dotenv.config({path:'.env.local',quiet:true});const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Apply requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; anonymous credentials are never used.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function main(){
 fs.mkdirSync(output,{recursive:true});fs.mkdirSync(assetDir,{recursive:true})
 const rollback=arg('--rollback','')
 if(rollback){if(!apply)throw new Error('Rollback requires --apply');const db=client();const journal=JSON.parse(fs.readFileSync(rollback,'utf8')) as Applied[];for(const item of [...journal].reverse()){const {data,error}=await db.from('lessons').select('id,content_blocks,updated_at').eq('id',item.id).single();if(error)throw error;if(data.updated_at!==item.afterUpdatedAt||!isDeepStrictEqual(data.content_blocks,item.after))throw new Error(`Rollback conflict: ${item.slug}; no overwrite.`);const result=await db.from('lessons').update({content_blocks:item.before,updated_at:new Date().toISOString()}).eq('id',item.id).eq('updated_at',item.afterUpdatedAt).select('id').single();if(result.error)throw result.error;console.log(`Rolled back ${item.slug}`)}return}
 const rows=JSON.parse(fs.readFileSync(input,'utf8')) as LessonRow[]
 const plans=rows.map(repair), changed=plans.filter(p=>!isDeepStrictEqual(p.before.content_blocks,p.after.content_blocks))
 for(const [key,asset]of assets)fs.writeFileSync(path.join(assetDir,`${key}.svg`),asset.svg)
 fs.writeFileSync(path.join(output,'before.json'),JSON.stringify(rows,null,2))
 fs.writeFileSync(path.join(output,'after.json'),JSON.stringify(plans.map(p=>p.after),null,2))
 fs.writeFileSync(path.join(output,'plan.json'),JSON.stringify(plans.map(p=>({id:p.after.id,slug:p.after.slug,published:p.after.published,changes:p.changes,errors:p.errors})),null,2))
 const published=plans.filter(p=>p.after.published),failed=published.filter(p=>p.errors.length)
 const report=[`# Lesson content repair review`,``, `Dry-run input: ${input}`,`Input SHA-256: ${createHash('sha256').update(fs.readFileSync(input)).digest('hex')}`,``,`${rows.length} lessons inspected; ${published.length} published. ${changed.length} documents change. ${failed.length} published documents still fail checks.`,`${assets.size} authored SVG representations; ${plans.flatMap(p=>p.changes).filter(c=>c.action==='exit').length} new close-out tasks.`,``,`Original block IDs/order, prompts, rubric fields, titles, slugs and publication flags are preserved. Changes are additive schema repair, copied callout body, support metadata, and explicit individual exit tasks. Existing grading thresholds are not altered.`,``,`## Pedagogical review`,``,`Symbolic diagrams show the physical objects, system boundaries, axes, geometry, or energy paths named by the existing lesson. They do not fabricate measurements. Transfer maps organize the real disciplinary tools; learners still choose the mapping and compute independently. Existing visuals are referenced only within a compatible track and target context.`,``,`Frames support claim/evidence/reasoning or numerical setup and units. Students supply the physics. Modes are restricted by the reader to implemented text/sketch choices.`,``,`## Apply / rollback`,``,`Apply only after the SVG assets and updated reader/lint are available. The script checks the snapshot content and updated_at before each write, performs a timestamp-guarded update, verifies readback, and journals before/after payloads to applied.json. It stops on the first conflict. Rollback uses the journal and refuses to overwrite any later edits.`,``,`## Per-lesson review`,...changed.flatMap(p=>[``,`### ${p.after.slug} — ${p.after.title}`,...p.changes.map(c=>`- ${c.blockId||'document'} · ${c.action}: ${c.detail}`),...p.errors.map(e=>`- CHECK FAILED: ${e}`)])].join('\n')
 fs.writeFileSync(path.join(output,'review.md'),report)
 console.log(JSON.stringify({lessons:rows.length,published:published.length,changed:changed.length,assets:assets.size,publishedFailures:failed.map(p=>({slug:p.after.slug,errors:p.errors})),output},null,2))
 if(!apply)return
 if(failed.length)throw new Error('No writes: published content still fails validation.')
 const db=client(),journal:Applied[]=[];const journalPath=path.join(output,'applied.json')
 if(fs.existsSync(journalPath))throw new Error('Output already contains applied.json; choose a fresh output directory to preserve rollback data.')
 fs.writeFileSync(journalPath,'[]')
 for(const p of changed){
  const {data,error}=await db.from('lessons').select('id,content_blocks,updated_at,published').eq('id',p.before.id).single();if(error)throw error
  if(data.updated_at!==p.before.updated_at||data.published!==p.before.published||!isDeepStrictEqual(data.content_blocks,p.before.content_blocks))throw new Error(`Concurrent edit: ${p.before.slug}; stopped without overwriting it.`)
  const stamp=new Date().toISOString();let query=db.from('lessons').update({content_blocks:p.after.content_blocks,updated_at:stamp}).eq('id',p.before.id).eq('published',p.before.published)
  query=p.before.updated_at?query.eq('updated_at',p.before.updated_at):query.is('updated_at',null)
  const saved=await query.select('id,content_blocks,updated_at').single();if(saved.error)throw saved.error
  journal.push({id:p.before.id,slug:p.before.slug,before:p.before.content_blocks,after:p.after.content_blocks,beforeUpdatedAt:p.before.updated_at,afterUpdatedAt:saved.data.updated_at});fs.writeFileSync(journalPath,JSON.stringify(journal,null,2))
  if(!isDeepStrictEqual(saved.data.content_blocks,p.after.content_blocks))throw new Error(`Verification failed for ${p.before.slug}; journal retained.`)
  console.log(`Applied ${p.before.slug}`)
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1})
