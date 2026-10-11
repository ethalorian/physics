const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out='/private/tmp/textbook-spanish-api.cjs';
let downloads=[],legacyReads=0,missing=false;
global.__textbookStorage={storage:{from:bucket=>({download:async key=>{downloads.push([bucket,key]);return missing?{data:null,error:new Error('not found')}:{data:new Blob(['%PDF-fixture']),error:null};}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{legacyReads++;return {data:null};}})})})};
(async()=>{
 const mocks={
  '@/lib/api-auth':`export const withAuth=fn=>(req,ctx)=>req.headers.get('x-test-user')?fn(req,ctx):Response.json({error:'Unauthorized'},{status:401});`,
  '@/lib/supabase':`export const supabaseAdmin=globalThis.__textbookStorage;`,
  'next/server':`export const NextResponse=Response;`,
 };
 await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/textbook/[chapter]/route.ts'],outfile:out,bundle:true,format:'cjs',platform:'node',plugins:[{name:'mocks',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'ts'}))}}]});
 const {GET}=require(out),request=(query='',user=true,ch='2')=>GET(new Request('http://fixture/api/textbook/'+ch+query,{headers:user?{'x-test-user':'student'}:{}}),{params:Promise.resolve({chapter:ch})});
 for(const lang of['en','es']){const r=await request('?lang='+lang,false);assert.equal(r.status,401);}assert.equal(downloads.length,0);
 let r=await request();assert.equal(r.status,200);assert.equal(r.headers.get('content-language'),'en');assert.equal(downloads.at(-1)[1],'cp02.pdf');
 r=await request('?lang=es');assert.equal(r.status,200);assert.equal(r.headers.get('content-language'),'es');assert.equal(downloads.at(-1)[1],'es/cp02.pdf');assert.match(r.headers.get('content-disposition'),/Espanol/);assert.match(r.headers.get('cache-control'),/^private/);assert.equal(legacyReads,0);
 for(const invalid of['fr','../en','ES',''])assert.equal((await request('?lang='+encodeURIComponent(invalid))).status,400);
 assert.equal((await request('',true,'41')).status,404);
 missing=true;r=await request('?lang=es');assert.equal(r.status,404);assert.equal(legacyReads,0,'Spanish may not fall back to English');
 r=await request('?lang=en');assert.equal(r.status,404);assert.equal(legacyReads,1,'English legacy compatibility retained');
 console.log('PASS: authentication wiring, private language-specific assets, Spanish filename/header, input validation, Spanish missing-file behavior, and English fallback compatibility.');
})().catch(e=>{console.error(e);process.exitCode=1});
