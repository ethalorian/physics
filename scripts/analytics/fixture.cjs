const path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const out = process.env.ANALYTICS_OUTPUT || path.join(root, 'work/analytics-qa');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const at = days => new Date(Date.now() - days * 86400000).toISOString();
async function fixture() {
 fs.mkdirSync(out, {recursive:true});
 const rows = Object.fromEntries(['courses','units','learning_targets','course_students','students','mastery_records','teacher_feedback','student_activity','quiz_assignments','quiz_submissions','quiz_reviews','interactive_assignments','interactive_assignment_submissions','lesson_submissions','lessons'].map(t=>[t,[]]));
 rows.courses = [{id:id(1),name:'Physics',section:'Period 2',teacher_email:'teacher.one@example.test',program:'physics',archived_at:null},{id:id(2),name:'Physics',section:'Period 4',teacher_email:'teacher.two@example.test',program:'physics',archived_at:null},{id:id(3),name:'Trades',section:'Workshop',teacher_email:'teacher.three@example.test',program:'trades',archived_at:null}];
 rows.units = [{id:'unit-1',name:'Motion & forces',program:'physics',order_index:1},{id:'trades-1',name:'Measurement',program:'trades',order_index:1}];
 rows.learning_targets = ['Explain displacement and velocity','Interpret a position–time graph','Model balanced and unbalanced forces'].map((statement,i)=>({id:id(10+i),slug:['u1.velocity','u1.graphs','u1.forces'][i],statement,unit_id:'unit-1',domain:i===2?'reasoning':'skill',program:'physics',exclude_from_growth:false}));
 const names = ['Avery Chen','Jordan Rivera','Maya Patel','Eli Brooks','Sofia Garcia','Noah Wilson','Zoe Kim','Lucas Reed','Amara James','Leo Martin','Isla Davis','Owen Taylor','Aria Singh','Henry Evans','Nora Wright','Theo Green','Ruby Scott','Finn Clark'];
 rows.students = names.map((name,i)=>({id:id(100+i),name,is_active:true}));
 rows.course_students = rows.students.map((p,i)=>({id:id(200+i),student_id:p.id,course_id:id(i<10?1:2),enrollment_state:'ACTIVE'}));
 rows.course_students.push({id:id(230),student_id:id(100),course_id:id(2),enrollment_state:'ACTIVE'});
 for (let i=0;i<16;i++) for(let t=0;t<3;t++) for(let j=0;j<3;j++) rows.mastery_records.push({id:id(1000+i*20+t*3+j),user_id:id(100+i),target_id:id(10+t),level:i%4===0?Math.min(3,j+1):i%4===1?(j===0?2:1):i%4===2?3:(j===2?2:1),observed_at:at(60-j*22),rated_by:rows.courses[i<10?0:1].teacher_email});
 const blooms=['Remember','Understand','Apply','Analyze','Evaluate','Create'];
 const prompts=['Define displacement in your own words.','Explain why distance and displacement can differ.','Find the average velocity for a rover that moves 12 m east in 4 s.','Compare the slopes of two position–time graphs.','Evaluate the claim that a horizontal velocity graph means no motion.','Design a method to compare balanced and unbalanced forces using measurements.'];
 for(let c=1;c<=2;c++) {
  const quiz={id:id(300+c),course_id:id(c),title:'Motion reasoning check',status:'published',deleted_at:null,questions:blooms.map((b,j)=>({id:id(400+j),kind:j<2?'choice':j<4?'written':'problem',options:j<2?['Distance only','Displacement with direction']:undefined,correct_index:j<2?1:undefined,prompt:prompts[j],points:4,target_id:id(10+[0,0,0,1,1,2][j]),demand:{blooms:b,dok:j>3?3:2,evidence:'Use quantities and evidence from the model.'}}))}; rows.quiz_assignments.push(quiz);
  for(let i=c===1?0:10;i<(c===1?10:16);i++) for(let attempt=0;attempt<3;attempt++) {
   const sub={id:id(5000+c*1000+i*10+attempt),quiz_id:quiz.id,user_id:id(100+i),snapshot:quiz,answers:Object.fromEntries(quiz.questions.map(q=>[q.id,q.kind==='choice'?String(attempt?1:0):attempt?'I compared the change in position across equal time intervals. The rover moves 3 metres east each second.':'The rover travels 12 metres. I need to include the time and direction.'])),submitted_at:at(50-attempt*10)}; rows.quiz_submissions.push(sub);
   rows.quiz_reviews.push({id:id(8000+c*1000+i*10+attempt),submission_id:sub.id,decision:'graded',scores:Object.fromEntries(quiz.questions.map((q,j)=>[q.id,Math.min(4,Math.max(0,(i%4===1?1:attempt+1)+(j<2?1:0)))])),ratings:{},note:'State the direction and connect your conclusion to the graph.',question_notes:{},reviewed_at:at(49-attempt*10),earned:12,possible:24,grade_mode:'numeric',grade_value:null});
  }
 }
 rows.quiz_submissions.push({...rows.quiz_submissions[0],id:id(99999),user_id:id(116),submitted_at:at(1)});
 const transferQuiz={...rows.quiz_assignments[0],id:id(350),title:'New-context motion check',questions:rows.quiz_assignments[0].questions.map((q,j)=>({...q,id:id(450+j),prompt:'Use a cyclist motion model: '+q.prompt}))}; rows.quiz_assignments.push(transferQuiz);
 for(let i=0;i<8;i++) {
  const sub={id:id(15000+i),quiz_id:transferQuiz.id,user_id:id(100+i),snapshot:transferQuiz,answers:Object.fromEntries(transferQuiz.questions.map(q=>[q.id,q.kind==='choice'?'1':'I connect the slope to change in position over elapsed time.'])),submitted_at:at(42)};rows.quiz_submissions.push(sub);
  rows.quiz_reviews.push({id:id(16000+i),submission_id:sub.id,decision:'graded',scores:Object.fromEntries(transferQuiz.questions.map(q=>[q.id,i%4===1?1:3])),ratings:{},note:'Check the direction in your explanation.',question_notes:{},reviewed_at:at(41),earned:18,possible:24,grade_mode:'numeric',grade_value:null});
 }
 rows.lessons=[{id:id(17000),title:'Motion models: explain and test',unit_id:'unit-1'}];
 rows.lesson_submissions=Array.from({length:5},(_,i)=>({id:id(17100+i),lesson_id:id(17000),user_id:id(100+i),submitted_at:at(50),content_snapshot:{blocks:[{targetIds:[id(10),id(11)]}]}}));
 rows.interactive_assignments=[{id:id(900),course_id:id(1),slug:'day-3-speed-velocity',target_id:id(10)}];
 rows.interactive_assignment_submissions=[{id:id(901),assignment_id:id(900),user_id:id(100),submitted_at:at(8),state:{attempts:{'1a':[{answer:'0',correct:false},{answer:'15',correct:true}],'1b':[{answer:'2',correct:false},{answer:'3',correct:false}]}}}];
 rows.teacher_feedback=[{id:id(950),user_id:id(100),target_id:id(10),created_at:at(9),message:'Your direction is now clear. Next, explain the slope using equal time intervals.',teacher_email:'teacher.one@example.test'}];
 rows.student_activity=Array.from({length:1521},(_,i)=>({id:id(20000+i),user_id:id(100+i%16),created_at:at(i%70+(i%24)/24),activity_type:['lesson_view','quiz_submit','practice_check'][i%3],user_agent:i%5?'Mozilla/5.0 CrOS':'Mozilla/5.0 iPhone Mobile'}));
 const state={rows,session:null,context:{},reads:0,failTable:null}; global.analyticsTestState=state;
 global.analyticsFakeDB={from(table){let predicates=[],orders=[],bounds=null;const query={select(columns){if(columns==='*')throw Error('Wildcard forbidden');return query},eq(k,v){predicates.push(r=>r[k]===v);return query},neq(k,v){predicates.push(r=>r[k]!==v);return query},is(k,v){predicates.push(r=>r[k]===v);return query},in(k,v){predicates.push(r=>v.includes(r[k]));return query},gte(k,v){predicates.push(r=>r[k]>=v);return query},lte(k,v){predicates.push(r=>r[k]<=v);return query},order(k,opts){orders.push([k,opts?.ascending!==false]);return query},range(a,b){bounds=[a,b];return query},then(resolve,reject){state.reads++;if(state.failTable===table)return Promise.resolve({data:null,error:{message:'Synthetic query error'}}).then(resolve,reject);if(!rows[table])throw Error('Unknown table '+table);let result=rows[table].filter(r=>predicates.every(p=>p(r))).sort((a,b)=>{for(const[k,asc]of orders){const c=String(a[k]??'').localeCompare(String(b[k]??''));if(c)return asc?c:-c}return 0});if(bounds)result=result.slice(bounds[0],bounds[1]+1);return Promise.resolve({data:structuredClone(result),error:null}).then(resolve,reject)}};return query}};
 const mocks={'server-only':'','next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)};','@/lib/auth':'export const auth=async()=>global.analyticsTestState.session;','@/lib/effective-context':'export const getEffectiveContext=async()=>global.analyticsTestState.context;','@/lib/student-enrollment':'export const requireEnrolledStudent=async()=>null;','@/lib/content-access':'export const canEditArea=async()=>false;','@/lib/supabase':'export const supabaseAdmin=global.analyticsFakeDB;'};
 await require(root+'/node_modules/esbuild').build({absWorkingDir:root,entryPoints:['src/app/api/analytics/workspace/route.ts'],outfile:out+'/route.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const route=require(out+'/route.cjs');
 const role=(effective,real=effective)=>{state.session=effective==='anonymous'?null:{user:{id:id(999),email:'analytics@example.test'}};state.context={role:effective,realRole:real,scopeEmail:'analytics@example.test',viewingAsTeacher:effective==='teacher'&&real==='admin'}};
 const call=(query='')=>route.GET({url:'http://local/api/analytics/workspace'+query,method:'GET'},{params:Promise.resolve({})});
 return {state,role,call,route,root,out,id,mocks};
}
module.exports={fixture,root,out};
