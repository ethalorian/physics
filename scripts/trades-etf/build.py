"""Build student lessons, teacher plans, drawings and printable HTML from one source.
No network calls. Database staging/activation is an explicit separate step.
"""
from pathlib import Path
import json, html, uuid, hashlib, runpy
from course import PROJECTS, DAYS

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
PUBLIC=ROOT/'public/trades-etf'
PUBLIC.mkdir(parents=True,exist_ok=True)
e=html.escape
def write(name,value): (HERE/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def txt(x,y,s,size=18,anchor='start'): return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{e(s)}</text>'
def line(x,y,x2,y2,dash=False): return f'<line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}"'+(' stroke-dasharray="7 5"' if dash else '')+'/>'
def box(x,y,w,h,fill='#edf5f4'): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'
def dim(x,y,x2,y2,s,tx,ty): return line(x,y,x2,y2)+txt(tx,ty,s,17,'middle')
def dot(x,y): return f'<circle cx="{x}" cy="{y}" r="4" fill="#176e72"/>'
def lamp(x,y): return f'<circle cx="{x}" cy="{y}" r="22" fill="white"/>'+line(x-15,y-15,x+15,y+15)+line(x-15,y+15,x+15,y-15)
ART={}
def art(key,title,body):
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480" role="img"><title>{e(title)}</title><desc>Original dimensioned classroom drawing. Not to scale; use written dimensions and the accompanying lesson.</desc><rect width="800" height="480" fill="white"/><style>text{{font-family:Arial,sans-serif;fill:#193940;stroke:none}}line,rect,path,circle{{stroke:#24525a;stroke-width:2}}</style>{txt(30,35,title,23)}{body}{txt(30,452,'NTS • Use written dimensions. Sizes are classroom examples.',17)}</svg>'
 (PUBLIC/(key+'.svg')).write_text(svg); ART[key]=title

s=box(80,95,525,200)
for x,label in [(230,'3 in'),(380,'6 in'),(580,'10 in')]: s+=line(x,95,x,295,True)+txt(x,320,label,17,'middle')
s+=txt(80,75,'A · datum',18)+txt(592,183,'tab',13,'middle')+dim(80,55,605,55,'10 1/2 in overall',340,75)+txt(625,195,'4 in',18)
s+=txt(135,200,'face 3 in',17)+txt(270,200,'face 3 in',17)+txt(435,200,'base 4 in',17)
s+=box(80,355,200,50)+line(80,380,280,380,True)+txt(302,384,'Lip: 4 × 1 in; fold into two 1/2-in strips',18)
art('stand','A · Folded stand — flat blank and separate lip',s)

s=box(140,105,480,225)+box(148,113,464,209,'white')
for x in [297,454]: s+=box(x,113,8,209,'#c9e4df')
for x in [220,380,535]:s+=txt(x,205,'2 1/2 in',18,'middle')+txt(x,231,'clear bay',15,'middle')
s+=dim(140,65,620,65,'8 in outside (example)',380,85)+txt(140,360,'Two internal partitions + two outer walls',18)+txt(140,390,'All four thicknesses: supplied 1/8 in each',18)
s+=txt(140,125,'',16)
art('organizer','B · Organizer top view — width across three bays',s)

s=box(180,100,425,262.5)
for x in [217.5,567.5]:
 for y in [137.5,325]: s+=dot(x,y)+line(x-12,y,x+12,y)+line(x,y-12,x,y+12)
s+=dim(180,70,605,70,'8 1/2 in overall',393,60)+txt(625,240,'5 1/4 in',17)+txt(95,387,'A',18)+txt(180,402,'Every center: 3/4 in from each nearest edge',18)+txt(32,215,'TOP',18)+txt(32,241,'VIEW',18)
art('template','C · Mounting template — mark centers; do not drill',s)

s=box(75,130,180,180)+txt(165,340,'PLAN · 6 × 6 in maximum',16,'middle')
s+=box(335,100,120,210)+line(335,100,455,310)+line(455,100,335,310)+txt(395,340,'ELEVATION',17,'middle')+txt(475,200,'12-in starting',17)+txt(475,224,'height target*',17)
s+=box(90,382,70,22)+box(380,382,70,22)+line(115,376,425,376)+txt(270,374,'8-in clear gap + 1-in bearing each end',15,'middle')
s+=txt(610,295,'*Teacher pilots',15)+txt(610,317,'height and load.',15)
art('tower','D · Tower views and separate beam/span detail',s)

s=box(80,90,320,240)+txt(240,70,'16 ft',18,'middle')+txt(25,214,'12 ft',17)+txt(95,115,'N ↑',20)
s+=box(120,320,60,20,'white')+line(120,330,120,270)+txt(160,362,'2-ft offset; 3-ft door',17,'middle')+txt(240,394,'FLOOR PLAN',18,'middle')
s+=box(440,170,320,160)+box(480,190,60,140,'white')+txt(600,150,'16 ft',18,'middle')+txt(659,215,'8-ft wall',17)+txt(510,355,'3 × 7-ft door',16,'middle')+txt(600,394,'SOUTH ELEVATION',18,'middle')
s+=txt(430,90,'Model scale: 1/2 in = 1 ft',19)
art('building','E · Example community room — coordinate the views',s)

s=box(90,155,180,170,'white')+box(430,135,220,210,'#c9e4df')+box(450,155,180,170,'white')
s+=txt(180,220,'60 g ice',22,'middle')+txt(540,220,'60 g ice',22,'middle')+txt(180,120,'CONTROL',19,'middle')+txt(540,110,'INSULATED TEST',19,'middle')
s+=txt(70,385,'Same containers, starting conditions, time and melt procedure.',19)+txt(70,414,'Layer detail: enclosure surrounds the matching inner container.',17)
art('thermal','F · Compare enclosures with a controlled ice test',s)

s=box(65,170,180,55)+line(25,198,65,198)+line(25,178,25,218)+txt(140,155,'INPUT syringe',18,'middle')
s+=line(245,198,365,198)+line(365,198,365,320)+line(365,320,540,320)+line(540,320,540,260)+box(515,190,50,70)+line(540,190,540,120)+box(470,105,140,15)+txt(540,85,'moving platform',18,'middle')
s+=line(465,120,465,345)+line(615,120,615,345)+box(430,345,220,20)+txt(660,245,'guide',17)+txt(670,320,'OUTPUT',17)
s+=txt(60,395,'A_in × input travel = A_out × output travel (ideal liquid model)',19)
s+=txt(60,423,'Example base: 6 × 4 in. Size mounts and travel clearance to your kit.',17)
art('fluid','G · Fluid machine — side view and connections',s)

s=box(80,100,190,200,'#d8eff5')+line(80,150,270,150,True)+txt(175,140,'start level',18,'middle')+line(270,280,470,280)+line(470,280,470,320)+box(420,320,170,80,'#d8eff5')
s+=txt(500,360,'collected mL',18,'middle')+txt(360,245,'tube path',18,'middle')+txt(440,100,'Change one tube condition.',20)+txt(440,135,'Reset the starting level.',20)+txt(440,170,'Measure volume and time.',20)
art('flow','H · Contained flow comparison',s)

s='<path d="M95 135 L480 135 L535 225 L480 315 L95 315 Z" fill="#edf5f4"/>'+line(95,225,535,225,True)+box(220,170,145,110,'#f4dfd7')
s+=line(70,195,250,195)+line(70,255,250,255)+txt(292,205,'prepared',17,'middle')+txt(292,235,'engine zone',17,'middle')+txt(292,263,'teacher checks',15,'middle')
s+=dim(95,90,535,90,'8-in hull envelope',315,76)+txt(560,225,'3 in wide',18)+txt(100,360,'Pipes: 1 in center-to-center, symmetric about centerline.',17)
s+=line(90,402,680,402)+txt(385,391,'Separate test lane: mark actual start → finish distance',17,'middle')
art('boat','I · Boat layout — not a boiler fabrication plan',s)

s=line(95,212,95,100)+line(95,100,160,100)+line(160,100,160,300)
s+=line(95,260,95,400)+line(95,400,490,400)+line(490,150,490,400)
s+=line(65,212,125,212)+line(78,260,112,260)+txt(42,218,'+',21)+txt(42,266,'−',21)
for y,n in [(150,1),(300,2)]:
 s+=line(160,y,205,y)+line(205,y,255,y-30)+line(275,y,363,y)+lamp(385,y)+line(407,y,490,y)+dot(160,y)+dot(490,y)
 s+=txt(240,y-48,'switch S'+str(n),17,'middle')+txt(385,y-35,'lamp L'+str(n),17,'middle')
s+=txt(295,430,'Second branch is optional for the first detector.',15,'middle')
s+=box(570,135,190,190)+line(665,135,665,325)+txt(618,180,'room 1',16,'middle')+txt(712,180,'room 2',16,'middle')+dot(610,230)+dot(710,230)+txt(666,358,'PHYSICAL LAYOUT',15,'middle')+txt(666,384,'Plan routes separately.',15,'middle')
art('circuit','J · Schematic symbols and physical layout',s)

s=''
for x,t,sub in [(45,'POWER','volts × amps'),(300,'TIME','hours'),(555,'ENERGY','watt-hours')]:s+=box(x,155,200,155)+txt(x+100,200,t,23,'middle')+txt(x+100,245,sub,19,'middle')
s+=txt(270,240,'×',28,'middle')+txt(525,240,'=',28,'middle')+txt(400,368,'1,000 Wh = 1 kWh',23,'middle')
art('energy','K · Power, time and energy are different quantities',s)

from explicit_drawings import generate as explicit_art
explicit_art(PUBLIC, ART)

STAGES=['Brief','Measure','Plan','Make','Test','Explain']; MINS=[10,15,15,45,15,10]
DOMAINS=[('math','reasoning','trade-math'),('measure','skill','metrology'),('plans','skill','plan-reading'),('build','product','engineering-design'),('vocabulary','knowledge','plan-reading')]
SPEC=[
 ['calculate fractional dimensions, clearance, material area and cost for a useful product','measure, lay out and inspect organizer parts from a consistent reference','interpret and revise dimensioned part drawings, views and cut lists','build, user-test and physically improve a useful organizer','define and use measurement, drawing, fit and fabrication vocabulary'],
 ['convert feet/inches, scale dimensions, and calculate building quantities and performance change','survey a space and check model dimensions, openings and structural/thermal tests','interpret coordinated floor plans, elevations, details, symbols and scale','build and improve a model building using structural and thermal test evidence','define and use building, scale, load and insulation vocabulary'],
 ['calculate displacement ratios, volume or distance rates, and performance change','measure device geometry and repeatable motion or flow with stated conditions','interpret fluid routes, assembly drawings, centerlines and parts lists','build, test, diagnose and physically improve a working fluid device','define and use fluid-system, assembly and performance-test vocabulary'],
 ['calculate wire quantities, relevant circuit relationships, power and energy','lay out circuit components and perform demonstrated measurements and inspection','interpret circuit symbols, complete paths, control states and physical wiring layouts','build, diagnose and improve a functioning low-voltage control system','define and use electrical-control, schematic, power and energy vocabulary'],
]
units=[];targets=[];tasks=[];lessons=[];plans={};links=[];counts={}
for p,project in enumerate(PROJECTS,1):
 uid=f'trades-etf-{p}'; plans[uid]=[]
 units.append(dict(id=uid,name=f'ETF Project {p}: '+project['name'],description=project['goal']+' Core strands: trades math, measuring, and drawing/plan interpretation.',order_index=p,program='trades',allotted_days=project['count']*2,default_start_date='2026-09-21' if p==1 else None))
 for i,(slug,domain,strand) in enumerate(DOMAINS):
  targets.append(dict(slug=f'etf26.p{p}.{slug}',statement='I can '+SPEC[p-1][i]+'.',domain=domain,unit_id=uid,program='trades',content_strand=strand,order_index=i+1,exclude_from_growth=False))
 tasks.append(dict(slug=f'etf26.p{p}.performance',unit_id=uid,program='trades',prompt='Demonstrate your working project and its tested revision. Independently interpret a supplied drawing, solve a trade calculation with units, perform a measurement/layout/inspection, and explain a changed requirement. Use the notebook and physical product; a teammate cannot supply your evidence.',rubric={'science':{'description':'Explains the relevant physical behavior and the limits of the classroom model using actual tests.'},'reasoning':{'description':'Independently selects and performs a trade calculation with units and checks its reasonableness.'},'communication':{'description':'Interprets the supplied plan correctly and creates a dimensioned drawing another person can follow.'},'transfer':{'description':'Uses a checked measurement and inspection to implement, retest and explain a physical revision.'}}))

def para(s): return '<p>'+e(s)+'</p>'
def lis(items):return '<ol>'+''.join('<li>'+e(x)+'</li>' for x in items)+'</ol>'
def section(t,s):return '<h2>'+e(t)+'</h2>'+s
STYLE='body{font:17px/1.5 system-ui;max-width:860px;margin:32px auto;padding:0 22px;color:#193940}h1{font-size:32px;line-height:1.15}h2{font-size:22px;margin-top:28px}a{color:#176e72}img{max-width:100%;height:auto}li{margin:8px 0}.tag{font-size:14px;font-weight:700}table{border-collapse:collapse;width:100%}td,th{border:1px solid #b8cacc;padding:8px;text-align:left}@media print{body{font-size:10pt;margin:0;padding:0}h1{font-size:20pt}h2{font-size:14pt;break-after:avoid}li,p{orphans:3;widows:3}img{max-height:3.3in}nav{display:none}article{break-after:page}}'
def page(title,body):return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(title)+'</title><style>'+STYLE+'</style></head><body>'+body+'</body></html>'

for number,d in enumerate(DAYS,1):
 p=d['project']; project=PROJECTS[p-1]; uid=f'trades-etf-{p}'; counts[p]=counts.get(p,0)+1; meeting=counts[p]
 slug=f'mvp-etf-{p}-{meeting:02d}'; ident=str(uuid.uuid5(uuid.NAMESPACE_URL,'https://www.antocciphysics.com/lessons/'+slug)); d.update(slug=slug,lesson_id=ident,meeting=meeting)
 leads=[d['product'], 'Measure the named features before making or changing a part.', d['read'], d['product'], 'Use the exact test below and keep every result.', 'Show your own math, measurement and plan-reading evidence.']
 directions=[
  ['Why this job: '+d['why'], 'Required today: '+d['product'], 'Look at the supplied labeled drawing. Find the finished object or test setup before starting.', 'Read the kit list. Take the listed continuing project out of storage; name missing items before beginning.'],
  d['measure'], d['plan'], d['build'], d['test'],
  ['Put these on the bench: '+d['done'][0], d['done'][1], 'Complete the independent transfer problem below. These supplied numbers are practice values; they do not change the required build dimensions.', d['exit'], 'Save one short individual answer with units, working and notebook page/date. Show the teacher your own physical measurement and plan interpretation. Store the labeled project and return shared supplies.']]
 notebooks=[
  'Title/date; one sentence naming today’s exact object and its purpose.',
  'Feature | required value | actual value | units | datum/endpoints. Keep repeat readings.',
  'Use the named sketch/table in the directions. Label views, dimensions, units and revision.',
  'Label made parts and note any changed dimension. A short labeled sketch is enough; do not write an essay.',
  'Copy the specified trial table; include each pass/fail or measured value and the change made.',
  'Individual transfer calculation with units + page/date containing the practical evidence.']
 titles=['Today’s exact job','Measure and mark','Read the plan and work the math','Numbered bench directions','Test and inspect','Show the finished work']
 blocks=[]
 for i,stage in enumerate(STAGES):
  bid=f'{slug}-{stage.lower()}'
  blocks.append(dict(id=bid,type='prose',markdown=leads[i],workshop=dict(pageBreakBefore=True,stage=stage,title=titles[i],lead=leads[i],minutes=MINS[i],notebook=notebooks[i],steps=directions[i],purpose=d['why'],catchUp=['Ask for a large printed drawing or fraction strip, then do a fresh measurement yourself.','If absent, retrieve the named project and follow the numbered build. Record a practical test as pending until you actually perform it.']),teachingMoment=dict(phase=['launch','investigate','model','investigate','discuss','exit'][i],title=titles[i],purpose=d['why']),teachingTool=dict(kind='case-board',version=1,frames=[dict(title=ART[d['diagram']],image='/trades-etf/'+d['diagram']+'.svg',alt=ART[d['diagram']]+'. '+d['read'],prompt='Point to the labeled part or test feature named in the directions.',body='Written dimensions govern. Keep this supplied drawing beside the build; use the numbered directions for assembly.')])) )
  if i==0:
   blocks.append(dict(id=bid+'-materials',type='callout',variant='note',title='Daily kit · one crew',markdown=d['kit']))
   blocks.append(dict(id=bid+'-finish',type='callout',variant='note',title='Finished means',markdown='\n\n'.join(d['done'])))
   blocks.append(dict(id=bid+'-print',type='prose',markdown=f'[Print the bench directions and drawing](/trades-etf/{slug}.html) · [Supplied drawing set](/trades-etf/drawings.html)'))
  if i==2:
   blocks.append(dict(id=bid+'-practice',type='callout',variant='note',title='Practice numbers versus build dimensions',markdown='The example and final transfer problem teach a method using supplied values. For construction, use the written dimensions in today’s plan and bench directions. For test results, use your actual measurements.'))
   blocks.append(dict(id=bid+'-example',type='worked_example',prompt=d['example'][0],equation=d['example'][1],work=d['example'][2],answer='Show the method and units; then use the required dimensions for the actual job.'))
  if i==5:
   blocks.append(dict(id=slug+'-evidence',type='exit_ticket',capture=True,requiredForCompletion=True,prompt=d['exit']+' Include units, enough working to check, and your notebook page/date. Practical evidence is checked with your teacher.',targetId=f'etf26.p{p}.math',evidenceRole='exit',xp=0 if number==1 else 10,workshop=dict(taskLabel='Save your individual evidence',purpose='One short response connects your calculation and plan interpretation to the notebook. The teacher observes measuring and building separately.'),sei=dict(visualBlockId=bid,frames=[dict(level=1,text='The plan shows ___. I used ___ to calculate ___. My answer is ___ (units). My notebook page is ___.'),dict(level=2,text='My reference is ___. I checked ___ by ___. The test supports ___, with the limit ___.')],wordBank=['dimension','datum','units','calculate','inspect','revision'],talkFirst=False)))
 doc=dict(schemaVersion=1,presentation='trades-workshop',dayType='WORKSHOP',lessonKind='daily',blocks=blocks)
 title=f'P{p} · {meeting:02d} · '+d['title']
 lesson=dict(id=ident,slug=slug,title=title,description=d['product'],unit=units[p-1]['name'],unit_id=uid,lesson_number=meeting,lesson_type='markdown',estimated_time=110,planned_days=2,published=False,visibility_track=None,objectives=['I can '+v+'.' for v in SPEC[p-1][:4]],content_blocks=doc)
 lessons.append(lesson)
 teacher=section('What exactly are we making or doing?',para(d['product'])+para('Why: '+d['why'])+lis(d['done']))
 teacher+=para('110 minutes / two periods. Seven crews for 15 students: six pairs and one trio. Rotate marker, maker and checker; each student keeps their own graph notebook and completes one digital transfer answer.')
 teacher+=section('Daily kit and preparation',para('Per crew: '+d['kit'])+para('Class quantities: prepare seven of these kits; each student has their own tape, pencil and notebook. Shared stations are identified explicitly above.')+para(d['prep']))
 teacher+=section('Project equipment and continuity',para(project['prep']))
 teacher+=section('Show this before students start',para(d['demo'])+'<p><a href="/trades-etf/'+d['diagram']+'.svg" target="_blank" rel="noreferrer">Open labeled assembly / test drawing</a></p><img style="max-width:100%;height:auto" src="/trades-etf/'+d['diagram']+'.svg" alt="'+e(ART[d['diagram']])+'"/>')
 teacher+=section('Learning targets',lis(lesson['objectives']))
 t=0
 for i,stage in enumerate(STAGES):
  teacher+=section(f'{t}–{t+MINS[i]} min · {stage} · '+titles[i],lis(directions[i])+para('Notebook: '+notebooks[i]));t+=MINS[i]
 teacher+=section('Teacher inspection points',para(d['look']))
 teacher+=section('If the build does not work',para(d['trouble']))
 teacher+=section('Worked trades math · supplied practice values',lis(d['example']))+section('Teacher answer key and interpretation',para(d['key']))
 teacher+=section('Individual practical evidence',lis(['Math: inspect the individual operation, units and reasonableness check.','Measuring: observe the student place/read the tool using the specified datum and endpoints.','Plan reading: ask the student to find one labeled dimension or connection on both drawing and object.','Build/revision: inspect the actual part, recorded test and named repair. Record independent / with cue / not observed separately; a crew result is not an individual demonstration.']))
 teacher+=section('Scope and support',para('Complete the specified baseline and test first. Only the revision described in this lesson is required. Use a large drawing, fraction strip or oral rehearsal as support, then collect a fresh independent check. Do not fill missing apparatus, dimensions or readings with guesses. Teacher equipment rehearsal checks local stock and kit fit before release; these authored designs have not been physically piloted by the curriculum author.'))
 teacher+=para(f'Student: /lessons/{slug} · Print: /trades-etf/{slug}.html · Explicit construction revision, September 23, 2026.')
 plan=dict(day=meeting,title=title,bodyHtml=teacher,kind='daily',lessonId=ident);plans[uid].append(plan)
 links.append(dict(lesson_id=ident,unit_id=uid,plan_day=meeting,plan_fingerprint=hashlib.sha256((title+'\n'+teacher).encode()).hexdigest()))
 body='<nav><a href="index.html">Course map</a> · <a href="/lessons/'+slug+'">Open app lesson</a></nav><article><p class="tag">'+e(project['source'])+'</p><h1>'+e(title)+'</h1>'+para(d['product'])+para('Name: __________________ Date: __________ · 110 minutes')
 body+=section('Why this job?',para(d['why']))+section('Daily kit · one crew',para(d['kit']))+section('Finished means',lis(d['done']))
 body+='<img src="'+d['diagram']+'.svg" alt="'+e(ART[d['diagram']])+'"/>'
 for i,stage in enumerate(STAGES):
  body+=section(stage+' · '+str(MINS[i])+' minutes · '+titles[i],lis(directions[i]))+para('Notebook: '+notebooks[i])
  if i==2:body+=section('Worked example · practice values',para('These supplied values teach the method. Build from today’s required plan dimensions; record your own actual test data.')+lis(d['example']))
 body+='</article>'
 (PUBLIC/(slug+'.html')).write_text(page(title,body))

# Keep teacher answers in the authenticated teacher-plan route, not public print files.
for name,data in [('lessons.json',lessons),('units.json',units),('targets.json',targets),('mastery-tasks.json',tasks),('plan-links.json',links),('days.json',DAYS)]:write(name,data)
(ROOT/'src/data/trades-etf-plans.json').write_text(json.dumps(plans,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/data/trades-etf-units.json').write_text(json.dumps({u['id']:u['name'] for u in units},ensure_ascii=False,indent=2)+'\n')
index='<h1>MVP Engineering · Build, Measure, Improve</h1>'+para('Four ETF projects. Trades math, accurate measuring, and drawing/plan interpretation in every project. 30 project meetings, four practice/revision meetings, and two exhibition meetings; about 110 minutes each. This sequence is not a fixed school calendar.')
index+=para('Read the plan → calculate → measure and lay out → build → inspect → revise. Use paper plans and your pocket notebook at the bench. Save one concise individual response in the app.')
index+='<p><a href="mvp-etf-1-01.html">First meeting: printable stand build</a> · <a href="drawings.html">Labeled assembly and test drawings</a></p>'
for p,u in enumerate(units,1):
 index+='<h2>'+e(u['name'])+'</h2>'+para(PROJECTS[p-1]['goal'])+'<ol>'
 for d in [x for x in DAYS if x['project']==p]:index+='<li><a href="/lessons/'+d['slug']+'">'+e(d['title'])+'</a> · <a href="'+d['slug']+'.html">print lesson</a>'+(' · '+e(d['kind']) if d['kind']!='core' else '')+'</li>'
 index+='</ol>'
index+=section('Prepare the working equipment',para('Each lesson specifies one required job, a daily kit, numbered directions and a defined test. Start with the card stand using folders and ordinary supplies. Plan thin card for trays/room models, matching 20-mL syringe/tube kits for delivery sleds, then 3-V lamps, two-AA holders, clothespins and supervised meter stations for controls. Teacher plans include demonstrations, inspection points and troubleshooting.'))
(PUBLIC/'index.html').write_text(page('MVP Engineering · ETF project course',index))
(PUBLIC/'drawings.html').write_text(page('MVP Engineering · supplied drawing set','<nav><a href="index.html">Course map</a></nav>'+''.join('<article><h1>'+e(v)+'</h1><img src="'+k+'.svg" alt="'+e(v)+'"/>'+para('Use written dimensions. These illustrations are NTS, including when printed. Reproduce parts with your tape/ruler; do not trace the screen or assume print size.')+'</article>' for k,v in ART.items())))
print(json.dumps(dict(projects=len(units),meetings=len(lessons),targets=len(targets),drawings=len(ART),captures=sum(sum(bool(b.get('capture')) for b in l['content_blocks']['blocks']) for l in lessons))))
