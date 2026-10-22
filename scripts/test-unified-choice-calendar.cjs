// Render the real shared calendar and choice planner together, without browser or database writes.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const root = path.resolve(__dirname, '..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'unified-choice-'));
const source = `
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import ChoiceCalendar from './src/components/choices/ChoiceCalendar';
import LearningCalendar from './src/app/home/LearningCalendar';
import {sectionProgress} from './src/lib/choice-calendar';
const dates=Array.from({length:7},(_,i)=>'2026-10-'+(19+i));
const makeSection=(id,title,source)=>({id,title,course_id:'c1',opens_at:'2026-10-19T12:00:00Z',due_at:'2026-10-23T21:00:00Z',required_count:1,points_per_choice:10,category_minimums:{},published:true,published_at:'2026-10-18T12:00:00Z',version:1,options:[{id:'option-'+id,title,category:'Independent',lab:false,targetIds:[],steps:[{id:source,sourceId:source,kind:'reading',title,href:'/readings/'+source,followUp:false}]}]});
const sections=[makeSection('one','Acceleration choice','a'),makeSection('two','Reflection choice','b')];
const selections=sections.map((s,i)=>({section_id:s.id,option_id:s.options[0].id,user_id:'student',selected:true,planned_on:null,step_dates:{[i?'b':'a']:'2026-10-23'},lab_completed_at:null,swap_requested:false,score:null}));
const data={staff:false,readOnly:false,courses:[{id:'c1',name:'Physics'}],courseId:'c1',sections,selections,bookings:[],slots:[],roster:[{id:'student',name:'Example'}],evidence:{student:{}},progress:{student:Object.fromEntries(sections.map(s=>[s.id,sectionProgress(s,selections,{},Date.parse('2026-10-21T12:00:00Z'))]))}};
const none=()=>{};
const renderCalendar=choices=><LearningCalendar choices={choices} dates={dates} today={dates[2]} day={dates[2]} offset={0} items={[{id:'reading:required',kind:'reading',title:'Required assignment',due:'2026-10-23T21:00:00Z',complete:false,status:'To do',action:'Open',href:'/readings/required'}]} mathForDay={()=>null} noSchoolDates={[]} mathLoading={false} mathError={false} editable={false} saving={false} onSelect={none} onDay={none} onWeek={none} onToday={none} onMore={none} onUnscheduled={none} onScheduleIssues={none} onMove={none}/>;
const render=(value=data,error=false,loading=false)=>renderToStaticMarkup(<ChoiceCalendar data={value} error={error} loading={loading} refresh={none} dates={dates} courseId={null} renderCalendar={renderCalendar}/>);
let html=render();
assert.equal((html.match(/<table/g)||[]).length,1,'one shared calendar');
assert(html.indexOf('Choice activity carousel')<html.indexOf('Weekly learning calendar'),'carousel above calendar');
const friday=html.match(/<td[^>]+data-calendar-date="2026-10-23"[^>]+data-lane="assignments"[^>]*>([\\s\\S]*?)<\\/td>/)[1];
for(const title of ['Required assignment','Acceleration choice','Reflection choice'])assert(friday.includes(title),'same day contains '+title);
assert(html.includes('data-choice-drop="2026-10-23"'),'shared dates accept choices');
assert(html.includes('aria-label="Fri, Oct 23"'),'mobile day navigation remains available');
for(const [name,value,error,loading] of [['empty',{...data,sections:[]},false,false],['loading',null,false,true],['failure',null,true,false]]){
 html=render(value,error,loading);assert.equal((html.match(/<table/g)||[]).length,1,name+' retains assigned calendar');assert(html.includes('Required assignment'),name+' retains required work');
}
html=render({...data,readOnly:true});assert(!html.includes('data-plannable="true"'),'read-only choices cannot be dragged');
console.log('PASS: one calendar, carousel order, required work and choices from multiple menus share a day, desktop/mobile drop targets, empty/loading/error fallback, read-only protection.');
`;
(async()=>{
 await require('esbuild').build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:out+'/verify.cjs',plugins:[{name:'link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'next/link',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"import React from 'react';export default function Link(p){return <a {...p}/>}",loader:'tsx',resolveDir:root}));}}]});
 require(out+'/verify.cjs');
})().catch(e=>{console.error(e);process.exitCode=1});
