// Validate the real AI request/response boundary with a fake provider, without sending data.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync('/private/tmp/lab-rubric-ai-');
(async()=>{
 await require(root+'/node_modules/esbuild').build({stdin:{contents:`export {assessVelocity} from './src/lib/interactive-assignments/grading-server';export {assignmentBySlug,objectiveQuestion} from './src/lib/interactive-assignments/catalog';export {labRubric} from './src/lib/interactive-assignments/lab-grades';`,resolveDir:root},bundle:true,platform:'node',format:'cjs',outfile:out+'/assessment.cjs',plugins:[{name:'fake-provider',setup(build){build.onResolve({filter:/^(server-only|@\/lib\/supabase)$/},args=>({path:args.path,namespace:'mock'}));build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='server-only'?'':'export const supabaseAdmin=global.labSuggestionDB;'}))}}]});
 let lesson;global.labSuggestionDB={from(){const query={select(){return query},eq(){return query},in(){return Promise.resolve({data:lesson.targets.map((slug,i)=>({id:String(i),slug,statement:'Physics target'})),error:null})}};return query}};
 const api=require(out+'/assessment.cjs');lesson=api.assignmentBySlug('simulation-race-track');
 const result={level:2,confidence:'low',rationale:'Teacher should review evidence.',feedback:'Use measurements to support the claim.',explanation:{status:'partial',reason:'Some evidence.'},items:lesson.questions.filter(q=>!api.objectiveQuestion(q)&&!q.reflection).map(q=>({id:q.id,status:'partial',reason:'Some evidence.'})),ratings:lesson.targets.map(target_slug=>({target_slug,level:2,confidence:'low',rationale:'Some evidence.',feedback:'Explain the transfer.'})),weakpoints:[],lab_scores:api.labRubric(lesson).map(q=>({id:q.id,earned:0,possible:q.possible,feedback:'Teacher review.'})),lab_dimensions:['science','reasoning','communication','transfer'].map(id=>({id,earned:2,possible:4,feedback:'Some evidence; review before release.'}))};
 process.env.ANTHROPIC_API_KEY='fictional-test-value';let request,answer=result;
 global.fetch=async(url,opts)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');request=JSON.parse(opts.body);return Response.json({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(answer)}],usage:{input_tokens:1,output_tokens:1}})};
 const assessed=await api.assessVelocity({answers:{},attempts:{}},true,lesson);assert.deepEqual(assessed.result.lab_dimensions,result.lab_dimensions);assert(request.output_config.format.schema.required.includes('lab_dimensions'));assert.match(request.system,/lowest score sets the grade/);assert.match(request.system,/UNTRUSTED DATA/);assert.match(request.system,/Do not derive these dimensions from the lab_scores total/);
 answer={...result,lab_dimensions:undefined};await assert.rejects(api.assessVelocity({answers:{},attempts:{}},true,lesson),/invalid assessment/);
 answer={...result,lab_dimensions:[...result.lab_dimensions.slice(0,3),result.lab_dimensions[0]]};await assert.rejects(api.assessVelocity({answers:{},attempts:{}},true,lesson),/invalid assessment/);
 const schema=request.output_config.format.schema;
 assert.equal(schema.properties.lab_dimensions.minItems,undefined);assert.equal(schema.properties.lab_dimensions.maxItems,undefined);
 answer={...result,lab_dimensions:result.lab_dimensions.map(d=>({...d,id:d.id.toUpperCase()}))};
 assert.deepEqual((await api.assessVelocity({answers:{},attempts:{}},true,lesson)).result.lab_dimensions,result.lab_dimensions);
 lesson=api.assignmentBySlug('day-7-acceleration');
 answer={level:2,confidence:'Medium',rationale:'Routine acceleration is supported.',feedback:'Explain the sign.',explanation:{status:'Partial',reason:'Explain the direction.'},items:lesson.questions.filter(q=>!api.objectiveQuestion(q)&&!q.reflection).map(q=>({id:q.id,status:'Partial',reason:'Explain the direction.'})),ratings:lesson.targets.map(target_slug=>({target_slug,level:2,confidence:'Medium',rationale:'Routine acceleration is supported.',feedback:'Explain the sign.'})),weakpoints:[{question_ids:['r2-6a'],concept:'Design & Defend',reason:'Support the design.',next_step:'Calculate the final velocity.'}]};
 const day7=await api.assessVelocity({answers:{},attempts:{}},true,lesson);
 assert.equal(day7.result.weakpoints[0].concept,'Design & defend');assert.equal(day7.result.items[0].status,'partial');assert.equal(day7.result.confidence,'medium');
 assert.deepEqual(request.output_config.format.schema.properties.items.items.properties.id.enum,lesson.questions.filter(q=>!api.objectiveQuestion(q)&&!q.reflection).map(q=>q.id));
 const logs=[],warn=console.warn;console.warn=(...args)=>logs.push(args);
 answer={...answer,weakpoints:[{...answer.weakpoints[0],concept:'PRIVATE_RESPONSE_MARKER'}]};
 try{await assert.rejects(api.assessVelocity({answers:{},attempts:{}},true,lesson),/invalid assessment/)}finally{console.warn=warn}
 assert.match(JSON.stringify(logs),/weakpoints.0.concept/);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_RESPONSE_MARKER|Calculate the final velocity/);
 console.log('PASS: actual Day 7 and lab provider boundaries normalize case, preserve private scores, reject invalid evidence and log only field paths. No provider request or grade write.');
})().catch(e=>{console.error(e);process.exitCode=1});
