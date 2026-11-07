import meetings from './meetings.json'
import projects from './projects.json'
import chapters from './chapters.json'
import { etfPages, etfPdf, etfSectionId } from './source'
import { onlineWork } from './online-work'

type Meeting = typeof meetings[number]
const escape = (v: string) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const unitId = (p: number) => 'trades-etfbook-' + p
const lessonId = (m: Meeting) => '304e741f-1bb9-4f4c-9d00-' + String(m.project).padStart(4,'0') + String(m.day).padStart(8,'0')
const taskName = (m: Meeting) => /^\d/.test(m.task) ? 'Task ' + m.task : m.task
const target = (m: Meeting) => 'etfbook.p' + m.project + '.' + m.strand
function stages(m: Meeting) {
  return [
    {stage:'Brief', minutes:10, title:m.title, text:m.entry},
    {stage:'Measure', minutes:15, title:'Gather evidence', text:m.measure},
    {stage:'Plan', minutes:15, title:'Prepare your design', text:m.plan},
    {stage:'Make', minutes:45, title:'At the bench', text:m.make},
    {stage:'Test', minutes:15, title:'Check and revise', text:m.test},
    {stage:'Explain', minutes:10, title:'Explain your decision', text:m.exit},
  ]
}
const projectName = (p: typeof projects[number]) => 'ETF ' + p.number + ' · ' + p.name
export const originalUnitLabels = Object.fromEntries(projects.map(p => [unitId(p.number),projectName(p)]))
export const originalUnits = projects.map(p => ({id:unitId(p.number),name:projectName(p),description:p.focus,order_index:10+p.number,program:'trades',allotted_days:meetings.filter(m=>m.project===p.number).length,default_start_date:null}))
const skills = {
  math:['reasoning','trade-math','use a calculation with units to justify a design decision'],
  measure:['skill','metrology','record a measurement and check how reliably it represents the design'],
  plans:['skill','plan-reading','use a labeled drawing to guide and revise a design'],
  build:['product','engineering-design','build and test a design against a stated criterion'],
}
export const originalTargets = projects.flatMap(p => Object.entries(skills).map(([key,[domain,content_strand,skill]],i)=>({slug:'etfbook.p'+p.number+'.'+key,statement:'I can '+skill+' in Project '+p.number+'.',domain,unit_id:unitId(p.number),program:'trades',content_strand,order_index:i+1,exclude_from_growth:false})))
function readings(m: Meeting) {return m.chapters.map(n=>chapters.find(c=>c.number===n)!)}
const packet = (m: Meeting) => '/etf-notebooks/project-'+m.project+'-meeting-'+String(m.day).padStart(2,'0')+'.pdf'
const patent = 'https://www.sciencetoymaker.org/wp-content/uploads/2017/03/Pattent-Piot1891.pdf'
function stationReference(m: Meeting) {
  if (m.project !== 3) return ''
  if (m.day === 1) return '<p><a href="'+patent+'">Piot’s original patent and drawings</a></p>'
  if (m.day === 2) return '<p>Prepare the physical pattern or pilot sample at the supervised station. <a href="'+projects[2].url+'#page='+parseInt(m.pages,10)+'">Teacher reference for the boat build and patterns</a>.</p>'
  return ''
}
export const originalPlans = Object.fromEntries(projects.map(p => [unitId(p.number), meetings.filter(m=>m.project===p.number).map(m=>({
  day:m.day, lessonId:lessonId(m), title:taskName(m)+' · '+m.title,
  bodyHtml:'<h2>'+escape(p.name)+'</h2><p>'+escape(p.focus)+'</p><h3>Set up before class</h3><p>'+escape(m.kit)+'</p><h3>Student packet and reading</h3><p><a href="'+packet(m)+'">Print this meeting’s student packet</a> · <a href="/etf-notebooks/project-'+m.project+'.pdf">Print the whole project booklet</a> · <a href="/etf-notebooks/index.html">All print packets</a></p><p>Students can keep measurements, drawings and test results in the app or use the matching printed packet. Students complete the assigned reading check and save their own final explanation in the app.</p>'+stationReference(m)+readings(m).map(c=>'<p><a href="/textbook/interactive/etf/'+c.number+'">Chapter '+c.number+' · '+escape(c.title)+'</a> · <a href="'+etfPdf(c)+'">printed pp. '+etfPages(c)+'</a>. '+escape(c.read)+'</p>').join('')+stages(m).map(s=>'<h3>'+s.stage+' · '+s.minutes+' min</h3><p>'+escape(s.text)+'</p>').join('')+'<h3>Evidence to look for</h3><p>'+escape(m.guide)+'</p><p>Collect the individual explanation in the lesson. Inspect the physical work and record your observation separately.</p>'
}))]))
export function buildLesson(m: Meeting) {
  const id=lessonId(m), slug='etf-book-'+m.project+'-'+String(m.day).padStart(2,'0'), p=projects[m.project-1]
  const blocks: Record<string,unknown>[]=[]
  for (const s of stages(m)) {
    const key=slug+'-'+s.stage.toLowerCase()
    blocks.push({id:key,type:'prose',markdown:s.text,note:s.stage==='Explain'?m.guide:undefined,
      workshop:{pageBreakBefore:true,stage:s.stage,title:s.title,lead:taskName(m)+' · '+p.name,minutes:s.minutes,studentPacket:packet(m),notebook:'Record your measurements, drawings and test results here or in the printed packet. Save your individual explanation in the Turn in step.',steps:s.stage==='Brief'?[m.entry,m.kit]:[s.text],purpose:p.focus,catchUp:[m.entry,'When a test needs equipment, arrange a bench check with your teacher and record the result after the test.']},
      teachingTool:{kind:'case-board',version:1,frames:[{title:s.title,prompt:s.text,body:s.stage==='Brief'?m.kit:taskName(m)+' · MVP student packet'}]}})
    if(s.stage==='Brief') {
      blocks.push({type:'prose',id:slug+'-sources',markdown:'[Print your student packet]('+packet(m)+')\n\n'+(m.project===3 && m.day===1?'[Open Piot’s original patent and drawings]('+patent+')\n\n':'')+readings(m).map(c=>'[Read '+c.title+', printed pp. '+etfPages(c)+']('+etfPdf(c)+') · '+c.read).join('\n\n')})
      for(const c of readings(m)) blocks.push({type:'reading',id:slug+'-ch'+c.number,chapter:c.number,sectionIds:[etfSectionId(c.number)],focus:c.read,assignmentChecks:[{reference:'ETF chapter '+c.number+' · '+c.title,prompt:c.read+' Cite a detail from the case and explain how it affects one choice in this project.',targetId:target(m)}]})
    }
    const record = onlineWork(m, s.stage)
    if (record) blocks.push({ ...record })
  }
  blocks.push({type:'exit_ticket',id:slug+'-evidence',capture:true,requiredForCompletion:true,prompt:m.exit,targetId:target(m),evidenceRole:'exit',xp:0,workshop:{taskLabel:'Save your individual explanation'},sei:{visualBlockId:slug+'-explain',frames:[{level:1,text:'I chose ___. My evidence was ___.'},{level:2,text:'The result ___ led me to change ___ because ___.'}],wordBank:p.terms.map(t=>t[0]),talkFirst:false}})
  return {id,slug,title:taskName(m)+' · '+m.title,description:p.focus,unit:projectName(p),unit_id:unitId(m.project),lesson_number:m.day,lesson_type:'markdown',estimated_time:110,planned_days:1,published:false,visibility_track:null,objectives:[originalTargets.find(t=>t.slug===target(m))!.statement],content_blocks:{schemaVersion:1,presentation:'trades-workshop',dayType:'WORKSHOP',lessonKind:'daily',blocks}}
}
export const originalLessons = () => meetings.map(buildLesson)
