// Read-only production checks. No real student sessions or submissions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base='https://www.antocciphysics.com';
const names=fs.readdirSync(root+'/public/trades-etf').filter(n=>/\.(html|svg)$/.test(n));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const checked=[];
 for(let i=0;i<names.length;i+=6){await Promise.all(names.slice(i,i+6).map(async n=>{
  const r=await fetch(base+'/trades-etf/'+n);assert.equal(r.status,200,n);
  const body=Buffer.from(await r.arrayBuffer());assert.equal(sha(body),sha(fs.readFileSync(root+'/public/trades-etf/'+n)),n);
  checked.push(n);
 }))}
 const old=await fetch(base+'/trades-reset/index.html');assert.equal(old.status,200);assert.match(await old.text(),/url=\/trades-etf\/index.html/);
 const student=await fetch(base+'/lessons/mvp-etf-1-01',{redirect:'manual'});assert.ok([302,303,307,308].includes(student.status));assert.match(student.headers.get('location')||'',/sign|auth|login/);
 const teacher=await fetch(base+'/api/teacher/lesson-plans?unit_id=trades-etf-1&course_id=33c5a178-998f-4158-aea9-f8589ade37b0',{redirect:'manual'});assert.equal(teacher.status,401);
 await student.arrayBuffer();await teacher.arrayBuffer();
 const report={at:new Date().toISOString(),base,publicArtifactsVerified:checked.length,allMatchLocalSource:true,oldCourseMapPointsToETF:true,signedOutLessonRedirect:student.status,teacherApiUnauthorized:teacher.status,productionStudentWrites:false};
 fs.writeFileSync('/private/tmp/etf-live-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)});
