const assert=require('node:assert/strict');
(async()=>{const f=await require('./fixture.cjs').fixture();
 for(const [role,real,status]of[['anonymous','anonymous',401],['student','student',403],['teacher','teacher',403],['teacher','admin',403]]){f.role(role,real);const before=f.state.reads;assert.equal((await f.call()).status,status);assert.equal(f.state.reads,before,'unauthorized reads must not reach database')}
 f.role('observer');const response=await f.call();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');const observer=await response.json();assert.equal(observer.classes.length,2);assert.equal(observer.students.length,18);assert.equal(observer.activity.length,1521,'all pages fetched');assert.equal(observer.questions.length,342);assert.equal(observer.practice.length,2);assert.equal(observer.assignments.length,63);assert.equal(observer.assignments.filter(a=>a.kind==='lesson'&&a.targetIds.length===2).length,5);assert.equal(observer.readOnly,true);assert.equal(JSON.stringify(observer).includes('Mozilla'),false);assert.equal(JSON.stringify(observer).includes('ip_address'),false);
 f.role('admin');const admin=await(await f.call()).json();for(const k of ['classes','students','ratings','questions','practice','assignments','feedback','activity'])assert.deepEqual(admin[k],observer[k],k+' identical for admin/observer');
 assert.equal((await f.call('?program=invalid')).status,400);assert.equal((await f.call('?days=0')).status,400);assert.equal((await f.call('?days=NaN')).status,400);
 const trades=await(await f.call('?program=trades')).json();assert.equal(trades.classes.length,1);assert.equal(trades.questions.length,0);assert.equal(trades.students.length,0);
 const before=f.state.rows.quiz_reviews.length;assert.equal(f.route.POST,undefined);assert.equal(f.route.PUT,undefined);assert.equal(f.route.DELETE,undefined);assert.equal(f.state.rows.quiz_reviews.length,before);
 f.state.failTable='mastery_records';const saved=console.error;console.error=()=>{};let failed;try{failed=await f.call()}finally{console.error=saved}assert.equal(failed.status,500);assert.deepEqual(await failed.json(),{error:'Internal server error'});
 const mocks={...f.mocks,'next/navigation':"export const redirect=url=>{throw Object.assign(new Error('redirect'),{location:url})}"};
 for(const entry of ['src/app/home/layout.tsx','src/app/admin/home/page.tsx']){
  const outfile=f.out+'/'+String(entry.includes('/admin/'))+'-landing.cjs';
  await require(f.root+'/node_modules/esbuild').build({absWorkingDir:f.root,entryPoints:[entry],outfile,bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
  const page=require(outfile).default;f.role('observer');await assert.rejects(()=>page({children:'content',searchParams:Promise.resolve({})}),e=>e.location==='/admin/analytics');
  if(entry.includes('layout')){f.role('student');assert.equal(await page({children:'content'}),'content');f.role('admin');assert.equal(await page({children:'content'}),'content')}
 }
 console.log('PASS: real authorization wrapper + analytics loader; 401/403 gates, observer/admin parity, 500-row pagination, program isolation, no writes, private cache, query-failure handling, observer landing redirects.');
})().catch(e=>{console.error(e);process.exitCode=1});
