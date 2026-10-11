const assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'..');
(async()=>{
 global.pulseChartsFixture={calls:[],fail:false};const f=global.pulseChartsFixture;
 const mocks={
 'next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)}',
 '@/lib/api-auth':'export const withAuth=h=>h',
 '@/lib/avatar/server':'export const avatarError=e=>Response.json({error:e.message},{status:400})',
 '@/lib/arcade':`export const isStaff=c=>c.role==='teacher';export const weekStartISO=()=> '2026-09-28T00:00:00Z';export const displayNames=async()=>new Map([['other','Physics fan']]);export const rankPlays=()=>[]`,
 '@/lib/supabase':`export const supabaseAdmin={rpc:async(name,args)=>{const f=global.pulseChartsFixture;f.calls.push({name,args});if(f.fail)return {error:{message:'Unavailable'}};return {data:name==='purchase_pulse_play'?{playId:'fixture',chartId:args.p_chart_id}:name==='purchase_arcade_play'?{playId:'other'}:{weekly:[{user_id:'me',score:900000,rank:1},{user_id:'other',score:800000,rank:2}],hallOfFame:[],myWeeklyRank:1}}}}`,
 };
 for(const name of ['coin','leaderboard'])await require('esbuild').build({entryPoints:[root+'/src/app/api/arcade/'+name+'/route.ts'],outfile:'/private/tmp/pulse-charts-'+name+'.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 const {POST}=require('/private/tmp/pulse-charts-coin.cjs'),{GET}=require('/private/tmp/pulse-charts-leaderboard.cjs');
 const buy=(body,ctx={userId:'me',email:'fixture@example.test',role:'student'})=>POST({json:async()=>body},ctx);
 for(const chartId of ['',null,1,{},'terminal-velocity-impossible'])assert.equal((await buy({slug:'pulse',chartId})).status,400);
 assert.equal(f.calls.length,0);
 let response=await buy({slug:'pulse'});assert.equal(response.status,200);assert.equal(f.calls.at(-1).args.p_chart_id,'neon-current-arcade');
 response=await buy({slug:'pulse',chartId:'terminal-velocity-overdrive',staff:true});assert.equal((await response.json()).chartId,'terminal-velocity-overdrive');assert.equal(f.calls.at(-1).args.p_staff,false);
 await buy({slug:'pulse',chartId:'solar-flare-master'},{userId:'teacher',role:'teacher'});assert.equal(f.calls.at(-1).args.p_staff,true);
 await buy({slug:'tether',chartId:'irrelevant'});assert.equal(f.calls.at(-1).name,'purchase_arcade_play');
 const board=q=>GET({nextUrl:new URL('https://example.test/api/arcade/leaderboard?slug=pulse'+q)},{userId:'me'});
 let n=f.calls.length;assert.equal((await board('&chart=invalid')).status,400);assert.equal(f.calls.length,n);
 const b=await(await board('&chart=terminal-velocity-overdrive')).json();assert.equal(b.chartId,'terminal-velocity-overdrive');assert.equal(f.calls.at(-1).args.p_chart_id,b.chartId);assert.equal(b.weekly[0].name,'You');assert.equal(b.weekly[1].name,'Physics fan');assert(!JSON.stringify(b).includes('user_id'));
 await board('');assert.equal(f.calls.at(-1).args.p_chart_id,'neon-current-arcade');f.fail=true;assert.equal((await board('')).status,503);
 console.log('PASS chart allowlist, legacy default, staff identity from auth, unchanged other-game purchase, selected-chart board, aliases, RPC failure response');
})().catch(e=>{console.error(e);process.exitCode=1});
