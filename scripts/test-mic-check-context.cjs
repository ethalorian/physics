// Exercise the real course context route with fixtures, not student records.
const assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'..');
(async()=>{
 global.micContext={rows:[],queries:[],positions:{},error:null};
 const mocks={
 'next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)};',
 '@/lib/api-auth':'export const withAuth=h=>h;',
 '@/lib/pacing-server':`export async function currentUnitForCourse(id){global.micContext.queries.push(id);return global.micContext.positions[id];}`,
 '@/lib/supabase':`export const supabaseAdmin={from(){return{select(){return{eq:async(k,id)=>{global.micContext.userId=id;return{data:global.micContext.rows,error:global.micContext.error}}}}}}};`,
 };
 await require('esbuild').build({entryPoints:[root+'/src/app/api/arcade/mic-check/context/route.ts'],outfile:'/private/tmp/mic-check-context.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 const {GET}=require('/private/tmp/mic-check-context.cjs'),f=global.micContext;
 const call=async(realRole='student')=>(await GET({}, {userId:'only-this-student',realRole})).json();
 assert.deepEqual(await call('teacher'),{unlockedThrough:8,preferredUnit:'unit-1'});assert.equal(f.queries.length,0);
 assert.deepEqual(await call(),{unlockedThrough:1,preferredUnit:'unit-1'});assert.equal(f.userId,'only-this-student');
 f.rows=[{course_id:'trade',courses:{program:'trades'}},{course_id:'physics-a',courses:[{program:'physics'}]},{course_id:'physics-a',courses:{program:'physics'}},{course_id:'physics-b',courses:{program:'physics'}}];f.positions={'physics-a':{program:'physics',unitId:'unit-2'},'physics-b':{program:'physics',unitId:'unit-4'}};
 assert.deepEqual(await call(),{unlockedThrough:4,preferredUnit:'unit-4'});assert.deepEqual(f.queries,['physics-a','physics-b']);
 f.positions['physics-b'].unitId='unit-99';assert.equal((await call()).unlockedThrough,2);
 f.error=new Error('Unavailable');await assert.rejects(call(),/Unavailable/);
 console.log('PASS course scoping, staff access, unit fallback, multiple courses, invalid-unit bounds and query errors');
})().catch(e=>{console.error(e);process.exitCode=1});
