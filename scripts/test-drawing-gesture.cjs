const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'drawing-gesture-')), 'input.cjs')
require('esbuild').buildSync({ stdin: {contents: fs.readFileSync(process.argv[2] || path.join(__dirname, '../src/lib/draw/input.ts'), 'utf8'), resolveDir: path.join(__dirname, '../src/lib/draw'), loader:'ts'}, outfile: out, bundle:true, platform:'node' })
const {makeStrokeHandlers} = require(out)
function setup(tool = 'pen') {
  let bounds = {left:20, top:10, width:320, height:180}, saved, emits = 0, capture = null
  const canvas = {getBoundingClientRect:()=>({...bounds}), setPointerCapture:id=>{capture=id}, releasePointerCapture:id=>{if(capture===id)capture=null}}
  const opts = {canvas:null,W:640,H:360,strokesRef:{current:[]},redoRef:{current:[]},drawingRef:{current:false},gestureRef:{current:null},tool,color:'#000000',size:4,fillShapes:false,repaint(){},emit(){saved=structuredClone(opts.strokesRef.current);emits++},bump(){}}
  let handlers = makeStrokeHandlers(opts)
  const event=(x=30,y=20,extra={})=>({currentTarget:canvas,clientX:x,clientY:y,pointerId:1,button:0,buttons:1,isPrimary:true,...extra})
  return {opts,event,get handlers(){return handlers},render(){handlers=makeStrokeHandlers(opts)},moveBounds(v){bounds={...bounds,...v}},get saved(){return saved},get emits(){return emits},get capture(){return capture}}
}
let count=0
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('first stroke and autosave rerender preserve pointer and scaling',()=>{
 const t=setup();t.handlers.onDown(t.event());assert.equal(t.capture,1);t.render();t.handlers.onMove(t.event(60,40));t.handlers.onUp(t.event());assert.deepEqual(t.saved[0].points,[{x:20,y:20},{x:80,y:60}]);assert.equal(t.emits,1);assert.equal(t.capture,null)
})
test('autosave layout jump ends the valid stroke without a false connecting line',()=>{
 const t=setup();t.handlers.onDown(t.event());t.handlers.onMove(t.event(60,40));t.moveBounds({top:34});t.render();t.handlers.onMove(t.event(60,40));assert.equal(t.opts.drawingRef.current,false);assert.deepEqual(t.saved[0].points,[{x:20,y:20},{x:80,y:60}]);t.handlers.onMove(t.event(100,80));t.handlers.onUp(t.event());assert.equal(t.emits,1);t.handlers.onDown(t.event(100,80));t.handlers.onUp(t.event());assert.equal(t.saved.length,2)
})
test('resize ends a shape without replacing its valid endpoint',()=>{
 const t=setup('rect');t.handlers.onDown(t.event());t.handlers.onMove(t.event(80,50));t.moveBounds({width:400,height:225});t.handlers.onMove(t.event(80,50));assert.deepEqual(t.saved[0].points,[{x:20,y:20},{x:120,y:80}])
})
test('second finger cannot add strokes, move ink or end the active pencil stroke',()=>{
 const t=setup();t.handlers.onDown(t.event());t.handlers.onDown(t.event(200,100,{pointerId:2,isPrimary:false}));t.handlers.onMove(t.event(200,100,{pointerId:2,isPrimary:false}));t.handlers.onUp(t.event(200,100,{pointerId:2}));assert.equal(t.emits,0);assert.equal(t.opts.strokesRef.current.length,1);t.handlers.onMove(t.event(60,40));t.handlers.onUp(t.event());assert.deepEqual(t.saved[0].points,[{x:20,y:20},{x:80,y:60}])
})
test('secondary presses and zero-size hidden canvas do not start drawing',()=>{
 const t=setup();t.handlers.onDown(t.event(30,20,{button:2}));t.handlers.onDown(t.event(30,20,{isPrimary:false}));t.moveBounds({width:0});t.handlers.onDown(t.event());assert.equal(t.opts.strokesRef.current.length,0)
})
test('lost release stops on hover without adding a phantom point',()=>{
 const t=setup();t.handlers.onDown(t.event());t.handlers.onMove(t.event(200,100,{buttons:0}));assert.deepEqual(t.saved[0].points,[{x:20,y:20}]);assert.equal(t.opts.drawingRef.current,false)
})
test('cancel and capture loss commit once and permit the next stroke',()=>{
 const t=setup();t.handlers.onDown(t.event());t.handlers.onMove(t.event(60,40));t.handlers.onUp(t.event());t.handlers.onUp(t.event());t.handlers.onMove(t.event(100,100));assert.equal(t.emits,1);t.handlers.onDown(t.event());t.handlers.onUp(t.event());assert.equal(t.saved.length,2)
})
test('subpixel layout rounding does not interrupt a valid stroke',()=>{
 const t=setup();t.handlers.onDown(t.event());t.moveBounds({top:10.25});t.handlers.onMove(t.event(60,40));assert.equal(t.opts.drawingRef.current,true);t.handlers.onUp(t.event());assert.equal(t.saved[0].points.length,2)
})
fs.rmSync(path.dirname(out),{recursive:true,force:true})
console.log(`${count} drawing gesture tests passed`)
