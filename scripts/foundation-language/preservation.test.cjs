const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('tsx/cjs');
const {protect}=require('./translate.cjs');
const {sources}=require('./source.cjs');
const base=process.env.FOUNDATION_LANGUAGE_BASELINE;
const dir='src/lib/interactive-assignments/foundations/';
const words=['one','two','three','four','five','six','seven','eight','nine'];
function shape(lesson){const question=({prompt,hint,explanation,options,...rest})=>({...rest,...(options?{optionCount:options.length}:{})});return {...lesson,sections:lesson.sections.map(({learn,title,...section})=>({...section,questions:section.questions.map(question)})),questions:lesson.questions.map(question)}}
test('all existing question identities, answer keys, scoring, targets and demands stay unchanged',{skip:!base},()=>{
 const before=JSON.parse(fs.readFileSync(base+'/content-before.json','utf8'));
 let count=0;
 for(let i=0;i<9;i++){const current=Object.values(require('../../'+dir+'day-'+words[i]+'.ts')).find(v=>v?.sections);assert.deepEqual(shape(current),shape(before[i].lesson));count+=current.questions.length;}
 assert.equal(count,88);
});
test('group stop identities and assessment demand stay unchanged',{skip:!base},()=>{
 const before=JSON.parse(fs.readFileSync(base+'/content-before.json','utf8'));
 const {getFoundationCheckpoints}=require('../../'+dir+'checkpoints.ts');
 before.forEach((b,i)=>assert.deepEqual(getFoundationCheckpoints('day-'+words[i]).map(c=>({id:c.id,demand:c.demand})),b.checkpoints.map(c=>({id:c.id,demand:c.demand}))));
});
test('translation manifest is exactly the current authored content',()=>{
 assert.deepEqual(sources(),require('../../src/data/foundations/language-sources.json'));
});
test('translation protection preserves values, signs, equations, links and bold markers; rejects corruption',()=>{
 const text='Find **−12.5 m/s²** at **4 s**. Use $v = v_0 + at$ and [the graph](/figures/graph.svg).';
 const p=protect(text),translated=p.source.replace('Find','Halla').replace(' at ',' a los ').replace('Use','Usa').replace(' and ',' y ').replace('the graph','el gráfico');
 const result=p.restore(translated);assert.match(result,/−12.5 m\/s²/);assert.match(result,/\$v = v_0 \+ at\$/);assert.match(result,/\]\(\/figures\/graph.svg\)/);
 assert.throws(()=>p.restore(translated.replace('⟦K0⟧','')));assert.throws(()=>p.restore(translated+' 99'));assert.throws(()=>p.restore(translated+'<img src=x>'));
 const quoted=protect('The example says, “The velocity is −4 m/s.” Is it right?');
 assert.equal(quoted.restore(quoted.source),'The example says, “The velocity is −4 m/s.” Is it right?');
 assert.ok(!quoted.source.includes('“'));assert.ok(!quoted.source.includes('”'));
 assert.deepEqual(protect('A 4-by-4 rectangle.').values,['4','4']);
 assert.deepEqual(protect('Values 1, 4, 7 m and 8,500 m.').values,['1','4','7','8,500']);
});
test('readable companions are derived from the real slide DOM, without script lookalikes or missing sections',()=>{
 const {assemble,companionSources}=require('./assemble.cjs');
 const identity=assemble({});
 assert.equal(companionSources().size,268);
 for(const source of companionSources())assert.equal(identity[source],source);
 const translated=assemble({Start:'Iniciar','Acceleration':'Aceleración'});
 assert.ok(Object.values(translated).some(text=>text.includes('Aceleración')));
});
test('slide translation preserves node identity, runtime updates and exact English text; rejects foreign senders',()=>{
 const text=value=>({nodeType:3,nodeValue:value,parentElement:null});
 class Element{constructor(tag,children=[],attrs={}){this.nodeType=1;this.tag=tag;this.childNodes=children;this.attrs=attrs;children.forEach(c=>c.parentElement=this)}closest(selector){if(selector==='section')return this.tag==='section'?this:this.parentElement?.closest(selector);return selector.split(',').includes(this.tag)?this:this.parentElement?.closest(selector)}matches(selector){return selector.split(',').includes(this.tag)}hasAttribute(k){return Object.hasOwn(this.attrs,k)}getAttribute(k){return this.attrs[k]}setAttribute(k,v){this.attrs[k]=v}}
 const label=text('  Start  '),timer=text('1:58'),answer=new Element('textarea',[text('My own response')]),slide=new Element('section',[new Element('button',[label]),new Element('div',[timer]),answer]);
 const body=new Element('body',[slide]),listeners={},parent={postMessage(){}},stage={index:12,length:30,goTo(){throw Error('Must not navigate on language change')}};
 const document={body,referrer:'https://lesson.example/path',documentElement:{lang:'en'},querySelector:()=>stage,addEventListener(){}};
 let observe;
 const window={parent,addEventListener:(k,fn)=>(listeners[k]??=[]).push(fn)};
 vm.runInNewContext(fs.readFileSync('scripts/day-one/slides-bridge.js','utf8'),{window,document,URL,Node:{TEXT_NODE:3,ELEMENT_NODE:1},MutationObserver:class{constructor(fn){observe=fn}disconnect(){}observe(){}}});
 const send=(source,origin,locale,map)=>listeners.message.forEach(fn=>fn({source,origin,data:{channel:'physics-day-one-slides-v1',type:'language',locale,map}}));
 send({},'https://lesson.example','es',{Start:'Iniciar'});assert.equal(label.nodeValue,'  Start  ');
 send(parent,'https://evil.example','es',{Start:'Iniciar'});assert.equal(label.nodeValue,'  Start  ');
 send(parent,'https://lesson.example','es',{Start:'Iniciar',Pause:'Pausa','My own response':'WRONG'});assert.equal(label.nodeValue,'  Iniciar  ');assert.equal(timer.nodeValue,'1:58');assert.equal(answer.childNodes[0].nodeValue,'My own response');assert.equal(slide.childNodes[0].childNodes[0],label);assert.equal(stage.index,12);
 label.nodeValue='Pause';observe([{type:'characterData',target:label}]);assert.equal(label.nodeValue,'Pausa');
 timer.nodeValue='1:57';observe([{type:'characterData',target:timer}]);assert.equal(timer.nodeValue,'1:57');
 send(parent,'https://lesson.example','en',{});assert.equal(label.nodeValue,'Pause');assert.equal(timer.nodeValue,'1:57');
 send(parent,'https://lesson.example','pt-BR',{Pause:'<img src=x>'});assert.equal(label.nodeValue,'<img src=x>');assert.equal(slide.childNodes[0].childNodes.length,1);
});
