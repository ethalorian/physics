// Server-only curriculum data publisher. No student answers, grades, or enrollment writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),env={};
for(const line of fs.readFileSync(root+'/.env.local','utf8').split(/\r?\n/)){const m=/^([A-Z0-9_]+)=(.*)$/.exec(line);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const base=env.NEXT_PUBLIC_SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(new URL(base).hostname,'ymszffulqmkqgvhioege.supabase.co');assert.ok(key,'Missing server key');
const course='33c5a178-998f-4158-aea9-f8589ade37b0',teacher='antoccic@fitchburg.k12.ma.us';
const read=n=>JSON.parse(fs.readFileSync(__dirname+'/'+n+'.json','utf8'));
const units=read('units'),targets=read('targets'),lessons=read('lessons'),tasks=read('mastery-tasks');
const oldIds=Array.from({length:6},(_,i)=>'trades-'+(i+1));
const list=xs=>'in.('+xs.join(',')+')';
async function api(table,query={},method='GET',body){
 const r=await fetch(base+'/rest/v1/'+table+'?'+new URLSearchParams(query),{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>null);if(!r.ok)throw Error(table+' '+r.status+' '+JSON.stringify(d));return d;
}
function canonical(o){if(Array.isArray(o))return o.map(canonical);if(o&&typeof o==='object')return Object.fromEntries(Object.keys(o).sort().map(k=>[k,canonical(o[k])]));return o}
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(canonical(o))).digest('hex');
(async()=>{
 const c=await api('courses',{id:'eq.'+course,select:'id,name,program,teacher_email,archived_at'});assert.equal(c.length,1);assert.equal(c[0].name,'MVP Engineering');assert.equal(c[0].program,'trades');assert.equal(c[0].teacher_email,teacher);assert.equal(c[0].archived_at,null);
 const enrolled=await api('course_students',{course_id:'eq.'+course,select:'course_id'});
 const oldUnits=await api('units',{id:list(oldIds)}),oldLessons=await api('lessons',{unit_id:list(oldIds)}),oldTargets=await api('learning_targets',{unit_id:list(oldIds)}),oldTasks=await api('mastery_tasks',{unit_id:list(oldIds)}),windows=await api('lesson_class_windows',{course_id:'eq.'+course});
 const existing=await api('lessons',{slug:list(lessons.map(l=>l.slug))});
 assert.equal(oldLessons.length,30,'Unexpected legacy lesson count; review before retiring');
 for(const l of existing){const authored=lessons.find(x=>x.slug===l.slug);assert.equal(l.id,authored.id);assert.equal(sha(l.content_blocks),sha(authored.content_blocks),'Existing new lesson differs; do not overwrite student-visible content blindly')}
 if(!process.argv.includes('--publish')){console.log(JSON.stringify({mode:'dry-run',course:c[0].name,enrolled:enrolled.length,newPhases:units.length,newLessons:lessons.length,newTargets:targets.length,newPerformanceTasks:tasks.length,retireLessons:oldLessons.length,release:'mvp-job-01 only',existingNew:existing.length},null,2));return}
 const backup='/private/tmp/trades-reset-before-publish.json';if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify({at:new Date().toISOString(),course:c,oldUnits,oldLessons,oldTargets,oldTasks,windows,existing},null,2),{mode:0o600});
 await api('units',{on_conflict:'id'},'POST',units);
 await api('learning_targets',{on_conflict:'slug'},'POST',targets);
 await api('mastery_tasks',{on_conflict:'slug'},'POST',tasks);
 // New lessons are held unpublished until the complete bundle passes readback.
 for(const l of lessons)if(!existing.some(x=>x.id===l.id))await api('lessons',{on_conflict:'slug'},'POST',[{...l,published:false}]);
 const check=await api('lessons',{id:list(lessons.map(l=>l.id)),select:'id,slug,title,unit_id,lesson_number,content_blocks'});assert.equal(check.length,36);
 for(const l of lessons){const d=check.find(x=>x.id===l.id);assert.equal(d.title,l.title);assert.equal(d.unit_id,l.unit_id);assert.equal(d.lesson_number,l.lesson_number);assert.equal(sha(d.content_blocks),sha(l.content_blocks),l.slug)}
 console.log('All 36 staged lessons match their authored content.');
 await api('lessons',{id:list(lessons.map(l=>l.id))},'PATCH',{published:true,updated_at:new Date().toISOString()});
 await api('lessons',{id:list(oldLessons.map(l=>l.id))},'PATCH',{published:false,updated_at:new Date().toISOString()});
 for(const u of oldUnits)await api('units',{id:'eq.'+u.id},'PATCH',{name:u.name.startsWith('Archive · ')?u.name:'Archive · '+u.name,order_index:100+Number(u.id.split('-').pop()),default_start_date:null});
 // Keep old records available for review; archive their targets from growth calculations.
 await api('learning_targets',{unit_id:list(oldIds)},'PATCH',{exclude_from_growth:true});
 await api('lesson_class_windows',{on_conflict:'course_id,lesson_id'},'POST',[{course_id:course,lesson_id:lessons[0].id,open_at:new Date().toISOString(),close_at:null,set_by:teacher}]);
 // The old Engineering release closes; historical records and other classes' windows stay intact.
 const ownOld=windows.filter(w=>oldLessons.some(l=>l.id===w.lesson_id));
 for(const w of ownOld)await api('lesson_class_windows',{id:'eq.'+w.id},'PATCH',{close_at:new Date().toISOString(),set_by:teacher});
 const final=await api('lessons',{unit_id:list([...oldIds,...units.map(u=>u.id)]),select:'id,slug,published,unit_id'});
 assert.equal(final.filter(l=>l.slug.startsWith('mvp-job-')&&l.published).length,36);assert.equal(final.filter(l=>oldIds.includes(l.unit_id)&&l.published).length,0);
 const release=await api('lesson_class_windows',{course_id:'eq.'+course,lesson_id:list(lessons.map(l=>l.id))});assert.equal(release.length,1);assert.equal(release[0].lesson_id,lessons[0].id);assert.equal(release[0].close_at,null);
 const report={at:new Date().toISOString(),course:c[0].name,enrolled:enrolled.length,published:36,retired:30,targets:24,performanceTasks:6,openLesson:'mvp-job-01',backup,studentRecordsChanged:false};
 fs.writeFileSync(__dirname+'/publish-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
