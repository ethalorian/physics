const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const esbuild = require('esbuild'), root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'block-experience-'));
async function bundle(entry, name, plugins = []) {
  const out = path.join(temp, name + '.cjs');
  await esbuild.build({ absWorkingDir: root, entryPoints: [entry], outfile: out, bundle: true, platform: 'node', format: 'cjs', plugins });
  return require(out);
}
(async () => {
  const { numericCell, axisRange } = await bundle('src/components/blocks/data-plot.ts', 'plot');
  const { isBlockComplete, isBlockDone } = await bundle('src/data/content-blocks.ts', 'blocks');
  const { createBlock } = await bundle('src/data/block-registry.ts', 'registry');
  const { filterDocumentForViewer } = await bundle('src/lib/track-visibility.ts', 'visibility');
  for (const values of [[-8,-2],[-3,5],[4,4],[0,0],[1e-12,2e-12],[-1e-12,-2e-12]]) {
    const {min,max}=axisRange(values); assert.ok(max>min);
    for(const n of values) assert.ok((n-min)/(max-min)>=0 && (n-min)/(max-min)<=1);
  }
  for(const invalid of ['', ' ', '12 m', '4oops', 'Infinity', 'NaN', '0x10']) assert.equal(numericCell(invalid),null,invalid);
  for(const valid of ['-3.2', '.5', '+2', '2e-12']) assert.equal(numericCell(valid),Number(valid));
  const q={id:'q',type:'question',capture:true,question:{prompt:'Choose',options:[{id:'a',text:'One'},{id:'b',text:'Two'}],correctOptionId:'a'}};
  const safe=filterDocumentForViewer({schemaVersion:1,blocks:[q]},{role:'student',track:'cpa'}).blocks[0];
  assert.equal(safe.question.correctOptionId,undefined); assert.equal(safe.question.autoCheckable,true);
  assert.equal(isBlockDone(safe,{optionId:'b',autoCheck:'mismatch'}),false);
  assert.equal(isBlockDone(safe,{optionId:'a',autoCheck:'match'}),true);
  assert.equal(isBlockDone(safe,{optionId:'a'}),false);
  const table={...createBlock('data_table','d'),minRows:2};
  assert.equal(isBlockComplete(table,{rows:[['-2','-4'],['0','0']],pattern:'Linear',interpret:'Position doubles.'}),true);
  assert.equal(isBlockComplete(table,{rows:[['-2','-4']],pattern:'Linear',interpret:'Position doubles.'}),false);
  assert.equal(isBlockComplete(table,{rows:[['-2m','-4'],['0','0']],pattern:'Linear',interpret:'Position doubles.'}),false);
  assert.equal(isBlockComplete(table,{rows:[['','']],pattern:'',interpret:''}),false);
  const frame={id:'f',type:'sentence_frame',capture:true,frame:'The force is ___ because ___.'};
  assert.equal(isBlockComplete(frame,{text:frame.frame}),false);
  assert.equal(isBlockComplete(frame,{text:'The force is upward because the object accelerates upward.'}),true);
  assert.equal(isBlockComplete({id:'t',type:'transfer_prompt',masteryTaskSlug:'task'}, {text:'My solution follows from these measurements.'}),true);
  assert.equal(isBlockComplete({id:'s',type:'sketch',capture:true,instruction:'Draw'}, {text:'Equal arrows upward and downward on the object.'}),true);
  const gewa=createBlock('gewa','g');
  assert.equal(isBlockComplete(gewa,{equationId:'f-ma',answer:'2 N'}),false);
  assert.equal(isBlockComplete(gewa,{given:'m = 1 kg; a = 2 m/s^2',equationId:'f-ma',work:'F = 1 kg × 2 m/s^2',answer:'2 N'}),true);
  assert.equal(isBlockComplete({...gewa,requireCompleteWork:undefined},{equationId:'f-ma',answer:'2 N'}),true);
  const concept={id:'c',type:'concept_exercise',capture:true,chapter:1};
  assert.equal(isBlockComplete(concept,{submitted:true,answers:{1:'A'},summary:{answeredCount:1,itemCount:3}}),false);
  assert.equal(isBlockComplete(concept,{submitted:true,answers:{1:'A'},summary:{answeredCount:1,itemCount:1}}),true);
  // Drive the real hook over consecutive render/effect cycles: hydration is inert,
  // but deleting the last character is an explicit draft, including after resume.
  const refs=[]; let cursor=0; const effects=[];
  global.__draftHooks={useRef(v){const i=cursor++;return refs[i]??(refs[i]={current:v})},useEffect(fn){effects.push(fn)}};
  const {useDraft}=await bundle('src/components/blocks/useDraft.ts','draft-hook',[{name:'react-test-hooks',setup(build){build.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'module.exports = global.__draftHooks',loader:'js'}));}}]);
  const emitted=[]; const render=(value)=>{cursor=0;useDraft(v=>emitted.push(v),value);while(effects.length)effects.shift()()};
  render({explain:'old answer'});assert.deepEqual(emitted,[]);
  render({explain:''});assert.deepEqual(emitted,[{explain:''}]);
  render({explain:''});assert.equal(emitted.length,1);
  render({explain:'new answer'});assert.equal(emitted.length,2);
  delete global.__draftHooks;
  console.log('PASS signed axes (negative-only, mixed, constant, near-zero), whole numeric cells, safe Done metadata, required table rows, untouched frames, transfer capture, keyboard sketch, strict/legacy GEWA, full concept completion, erase/resume draft hook');
})().catch(error=>{console.error(error);process.exitCode=1});
