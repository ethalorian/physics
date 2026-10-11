// Exercise the real score route with a synthetic database adapter; no live user data.
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
  global.micScoreFixture={play:{id:'run',user_id:'student',game_slug:'mic-check',status:'active',score:0,meta:{},created_at:new Date().toISOString()},updates:[]};
  const mocks={
    'next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)};',
    '@/lib/api-auth':'export const withAuth=h=>h;',
    '@/lib/arcade':'export const PLAY_MAX_AGE_MS=3600000;',
    '@/lib/supabase':`export const supabaseAdmin={from(table){let update;const filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},maybeSingle(){return q},single:async()=>({data:table==='arcade_plays'?global.micScoreFixture.play:{max_plausible_score:1000000}}),update(value){update=value;return q},then(resolve){const f=global.micScoreFixture;if(!filters.every(([k,v])=>f.play[k]===v))return Promise.resolve({data:null,error:null}).then(resolve);f.updates.push(update);Object.assign(f.play,update);return Promise.resolve({data:{id:f.play.id},error:null}).then(resolve)}};return q}};`,
  };
  await require('esbuild').build({entryPoints:[root+'/src/app/api/arcade/score/route.ts'],outfile:'/private/tmp/mic-check-score-route.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
  const {POST}=require('/private/tmp/mic-check-score-route.cjs'),f=global.micScoreFixture;
  const call=(body,userId='student')=>POST({json:async()=>body},{userId});
  assert.equal((await call({playId:'run',score:NaN})).status,400);
  assert.equal((await call({playId:'run',score:999,final:true},'another-student')).status,404);
  assert.equal(f.updates.length,0);
  const saved=await(await call({playId:'run',score:9000000,final:true})).json();assert.equal(saved.score,1000000);assert.equal(f.play.status,'finished');
  const retry=await(await call({playId:'run',score:12,final:true})).json();assert.equal(retry.alreadySaved,true);assert.equal(retry.score,1000000);assert.equal(f.updates.length,1);
  assert.equal((await call({playId:'run',score:800,final:false})).status,409);
  f.play.status='active';f.play.created_at='2000-01-01T00:00:00Z';assert.equal((await call({playId:'run',score:800,final:true})).status,410);
  console.log('PASS Mic Check score ownership, finite score validation, 1,000,000 cap, final retry idempotence, closed checkpoint rejection, and expired credit');
})().catch(e=>{console.error(e);process.exitCode=1});
