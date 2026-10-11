const fs=require('fs'),assert=require('assert/strict');const path=require('path'),os=require('os');const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'role-experience-api-'));fs.symlinkSync(root+'/node_modules',out+'/node_modules','dir');
const esbuild=require(root+'/node_modules/esbuild');process.env.NEXTAUTH_SECRET='local-role-experience-test-key';process.env.NODE_ENV='test';
const admin={id:'admin-id',email:'owner@example.invalid',name:'Owner',role:'admin'};
const student={id:'student-id',email:'student@example.invalid',name:'Example Student',role:'student'};
const teacher={id:'teacher-id',email:'teacher@example.invalid',name:'Example Teacher',role:'teacher'};
let sessionActor=admin,cookie;
global.__experienceTest={cookie:()=>cookie,actor:()=>sessionActor,rows:{students:[admin,student,teacher],courses:[{id:'class-a',name:'Physics',teacher_email:teacher.email}],course_students:[{course_id:'class-a',student_id:student.id}],user_roles:[{email:teacher.email,role:'teacher'}]}};
const mocks={
 'next-auth/providers/google':'export default config=>config;',
 'next-auth/providers/credentials':'export default config=>config;',
 'server-only':'',
 'next/headers':`export const cookies=async()=>({get:name=>name==='role_experience'&&globalThis.__experienceTest.cookie()?{value:globalThis.__experienceTest.cookie()}:undefined,has:name=>name==='role_experience'&&!!globalThis.__experienceTest.cookie()});`,
 'next-auth':`export default function NextAuth(config){globalThis.__capturedAuth=config;return{handlers:{},auth:async()=>{const actor=globalThis.__experienceTest.actor();return actor?config.callbacks.session({session:{user:{...actor},expires:'2099-01-01'},token:{sub:actor.id,email:actor.email,role:actor.role,accessToken:'real-admin-google-credential'}}):null},signIn:()=>{},signOut:()=>{}}}`,
 '@/lib/roles':`export async function getGrantedRole(email){return email==='grantedadmin@example.invalid'&&!globalThis.__experienceTest.revoked?'admin':email==='teacher@example.invalid'?'teacher':null}export const requestTeacherAccess=async()=>{};`,
 './roles':`export async function getGrantedRole(email){return email==='grantedadmin@example.invalid'&&!globalThis.__experienceTest.revoked?'admin':email==='teacher@example.invalid'?'teacher':null}export const requestTeacherAccess=async()=>{};`,
 '@/lib/permissions':`export const getUserRole=email=>email==='owner@example.invalid'?'admin':email==='teacher@example.invalid'?'teacher':'student';`,
 './permissions':`export const getUserRole=email=>email==='owner@example.invalid'?'admin':email==='teacher@example.invalid'?'teacher':'student';`,
 './student-management':`export const ensureStudentRecord=async()=>({}),resolveCanonicalUserId=async()=>null;`,
 './presence':`export const recordStaffLogin=async()=>{},recordStudentLogin=async()=>{};`,
 './access':`export const isSchoolStudentEmail=()=>true,isSchoolStaffEmail=()=>true;`,
 './oauth-security':`export const encryptToken=x=>x,decryptToken=x=>x,getInitialScopes=()=>[],getSecureClientCredentials=async()=>({}),handleTokenRefreshError=async()=>({}),isTokenExpired=()=>false,logOAuthClientUsage=async()=>{},validateOAuthConfig=()=>{};`,
 '@/lib/supabase':`class Query{constructor(table){this.rows=[...(globalThis.__experienceTest.rows[table]||[])]}select(){return this}eq(k,v){this.rows=this.rows.filter(r=>r[k]===v);return this}in(k,vs){this.rows=this.rows.filter(r=>vs.includes(r[k]));return this}order(){return this}maybeSingle(){return Promise.resolve({data:this.rows[0]||null,error:null})}single(){return this.maybeSingle()}then(resolve,reject){return Promise.resolve({data:this.rows,error:null}).then(resolve,reject)}}export const supabaseAdmin={from:t=>new Query(t)};`,
 '@/lib/program':`export const getStudentProgram=async()=> 'physics';export const getProgramUnitIds=async()=>['unit-1'];`,
 '@/lib/lesson-windows':`export const getStudentLessonWindowStatuses=async()=>({open:{state:'open'},closed:{state:'closed'}});`,
 '@/lib/student-enrollment':`export const getStudentTrack=async()=> 'cpa';export const requireEnrolledStudent=async(id,role)=>role==='student'&&id!=='student-id'?Response.json({error:'not enrolled'},{status:403}):null;`,
 '@/lib/content-access':`export const canEditArea=async(email,area,isAdmin)=>isAdmin;`,
};
(async()=>{
 await esbuild.build({stdin:{contents:`export * as route from './src/app/api/admin/experience/route';export {auth} from './src/lib/auth';export * from './src/lib/experience-token';export * from './src/lib/api-auth';export {middleware} from './src/middleware';`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:out+'/api-bundle.cjs',packages:'external',plugins:[{name:'mocks',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'ts',resolveDir:root}))}}]});
 const api=require(out+'/api-bundle.cjs');const {NextRequest}=require(root+'/node_modules/next/server');
 const req=(method='GET',body,headers={})=>new NextRequest('https://app.example.invalid/api/admin/experience',{method,headers:{origin:'https://app.example.invalid',...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
 let assertions=0;const equal=(a,b)=>{assert.equal(a,b);assertions++};
 equal((await api.route.GET(req())).status,200);
 for(const actor of [null,student,teacher,{...student,role:'observer'}]){sessionActor=actor;equal((await api.route.GET(req())).status,403);equal((await api.route.POST(req('POST',{role:'admin'}))).status,403)}
 sessionActor=admin;
 global.__experienceTest.rows.lessons=[{id:'open',title:'Open',unit_id:'unit-1',published:true},{id:'closed',title:'Closed',unit_id:'unit-1',published:true},{id:'draft',title:'Draft',unit_id:'unit-1',published:false},{id:'hidden',title:'Hidden',unit_id:'unit-1',published:true,visibility_track:'honors'},{id:'unreleased',title:'Unreleased',unit_id:'unit-1',published:true}];
 // The availability catalog now includes only current learning-path lessons.
 global.__experienceTest.rows.lessons=global.__experienceTest.rows.lessons.map(lesson=>({...lesson,content_blocks:{schemaVersion:1,presentation:'physics-path',learningPath:{version:1,kind:'lesson',focus:'Fixture'},blocks:[]}}));
 const availability=await(await api.route.GET(new NextRequest('https://app.example.invalid/api/admin/experience?class=class-a&student=student-id'))).json();
 const reasons=Object.fromEntries(availability.availability.map(l=>[l.id,l.reason]));equal(reasons.open,'Available');equal(reasons.closed,'Class access closed');equal(reasons.draft,'Unpublished');equal(reasons.hidden,'Different course track');equal(reasons.unreleased,'Not released to this student’s classes');
 equal((await api.route.GET(new NextRequest('https://app.example.invalid/api/admin/experience?class=class-a&student=outsider'))).status,403);
 equal((await api.route.POST(req('POST',{role:'admin'},{origin:'https://other.example.invalid'}))).status,403);
 equal((await api.route.POST(req('POST',{role:'root'}))).status,400);
 equal((await api.route.POST(req('POST',{role:'student',classId:'class-a',studentId:'outsider'}))).status,403);
 equal((await api.route.POST(req('POST',{role:'student',classId:'other',studentId:student.id}))).status,404);
 equal((await api.route.POST(req('POST',{role:'teacher',teacherEmail:'outsider@example.invalid'}))).status,400);
 for(const role of ['student','teacher','observer','admin']){
   cookie=undefined;const start=await api.route.POST(req('POST',{role,classId:'class-a',studentId:student.id,teacherEmail:teacher.email}));equal(start.status,200);
   cookie=start.cookies.get('role_experience').value;
   equal(start.cookies.get('role_experience').httpOnly,true);
   const session=await api.auth();equal(session.user.role,role);equal(session.experience.actor.id,admin.id);equal(session.accessToken,undefined);
   if(role==='student')equal(session.user.id,student.id);
   if(role==='teacher')equal(session.user.email,teacher.email);
   const echo=api.withAuth(async(_r,ctx)=>Response.json({id:ctx.userId,role:ctx.role,realRole:ctx.realRole,email:ctx.scopeEmail}));
   const echoResponse=await echo(new NextRequest('https://app.example.invalid/api/test'),{params:Promise.resolve({})});
   equal(echoResponse.status,200);const context=await echoResponse.json();equal(context.role,role);equal(context.realRole,role);equal(context.id,session.user.id);
   const adminOnly=api.withRole('admin',()=>Response.json({ok:true}));equal((await adminOnly(new NextRequest('https://app.example.invalid/api/test'),{params:Promise.resolve({})})).status,role==='admin'?200:403);
   const modify=api.withAuth(()=>{throw Error('Mutation handler must never execute')});equal((await modify(new NextRequest('https://app.example.invalid/api/test',{method:'POST'}),{params:Promise.resolve({})})).status,403);
   equal((await api.route.GET(req())).status,200); // Return/switch remains usable in every projected role.
   const blocked=await api.middleware(new NextRequest('https://app.example.invalid/api/test',{method:'POST',headers:{cookie:'role_experience='+cookie,'x-role-experience':session.experience.id}}));equal(blocked.status,403);
   const stale=await api.middleware(new NextRequest('https://app.example.invalid/api/test',{headers:{cookie:'role_experience='+cookie,'x-role-experience':'older-tab'}}));equal(stale.status,409);
 }
 // Even possession of another admin's signed cookie cannot change this login.
 sessionActor=student;equal((await api.auth()).user.id,student.id);equal((await api.auth()).experience,undefined);
 sessionActor=admin;const expired=await api.verifyExperience(cookie,process.env.NEXTAUTH_SECRET);expired.expiresAt=Date.now()-1000;cookie=await api.signExperience(expired,process.env.NEXTAUTH_SECRET);
 equal((await api.middleware(new NextRequest('https://app.example.invalid/api/test',{method:'POST',headers:{cookie:'role_experience='+cookie}}))).status,409);
 const exit=await api.route.DELETE(req('DELETE'));equal(exit.status,200);equal(exit.cookies.get('role_experience').maxAge,0);
 cookie=undefined;equal((await api.auth()).user.id,admin.id);equal((await api.auth()).accessToken,'real-admin-google-credential');
 equal((await api.route.DELETE(req('DELETE',undefined,{origin:'https://other.example.invalid'}))).status,403);
 cookie=undefined;sessionActor={id:'granted-admin',email:'grantedadmin@example.invalid',name:'Granted Admin',role:'admin'};const grantedStart=await api.route.POST(req('POST',{role:'admin'}));equal(grantedStart.status,200);cookie=grantedStart.cookies.get('role_experience').value;global.__experienceTest.revoked=true;equal((await api.auth()).experience,undefined);const revoked=api.withRole('admin',()=>Response.json({ok:true}));equal((await revoked(new NextRequest('https://app.example.invalid/api/test'),{params:Promise.resolve({})})).status,403);
 console.log(JSON.stringify({passed:true,assertions,scope:'Real session callback, management route, API role gates, middleware, cookie isolation, expiry, and exit. Synthetic accounts; no database writes.'}));
})().catch(error=>{console.error(error);process.exitCode=1});
