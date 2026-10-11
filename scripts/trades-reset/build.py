from pathlib import Path
import json, html, re, uuid, hashlib
from course import UNITS, TARGETS, JOBS

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'scripts/trades-reset'
PUBLIC=ROOT/'public/trades-reset'
PUBLIC.mkdir(exist_ok=True)
def clean(v):
    if isinstance(v,str):
        v=re.sub(r'(?<=[a-zA-Z])(?=[0-9$])|(?<=[0-9])(?=[a-zA-Z])',' ',v)
        return re.sub(r'(?<=[;,])(?=\S)',' ',v)
    if isinstance(v,list) or isinstance(v,tuple): return [clean(x) for x in v]
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
    return v
JOBS=clean(JOBS)
e=html.escape
def save(name, data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# True vector diagrams: intentionally drawn teaching representations, not photographs.
def line(x1,y1,x2,y2,extra=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {extra}/>'
def rect(x,y,w,h,extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" {extra}/>'
def label(x,y,t,size=20,anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{e(t)}</text>'
def dimension(x1,y1,x2,y2,t,tx,ty):
    return line(x1,y1,x2,y2,'marker-start="url(#a)" marker-end="url(#a)"')+label(tx,ty,t,18,'middle')
def diagram(kind):
    s=''
    if kind=='tray':
        s=rect(205,80,390,235,'fill="#e7eef1"')+rect(250,125,300,145,'fill="#fff"')
        for x in [250,550]:
            s+=line(x,80,x,125,'stroke="#b24332" stroke-width="5"')+line(x,270,x,315,'stroke="#b24332" stroke-width="5"')+line(x,125,x,270,'stroke-dasharray="8 6"')
        for y in [125,270]: s+=line(205,y,595,y,'stroke-dasharray="8 6"')
        s+=label(400,180,'INSIDE BASE',24,'middle')+label(400,214,'notebook + two side gaps',18,'middle')
        s+=label(227,105,'tab',14,'middle')+label(570,105,'tab',14,'middle')
        s+=dimension(205,55,595,55,'BLANK = BASE + TWO WALLS',400,40)
        s+=label(400,355,'Dashed: fold • Red: four short cuts • Keep the tabs',18,'middle')
    elif kind in ('layout','frame'):
        s=rect(190,85,390,230,'fill="#edf3f4"')+line(190,85,580,315,'stroke-dasharray="7 5"')+line(190,315,580,85,'stroke-dasharray="7 5"')
        s+=label(175,338,'A · datum',18)+label(385,210,'diagonals',20,'middle')
        s+=dimension(190,55,580,55,'WIDTH',385,39)+dimension(620,85,620,315,'HEIGHT',693,208)
        s+=label(400,369,'Check sides, diagonals, and the reference corner',20,'middle')
    elif kind=='survey':
        s=rect(145,80,475,245,'fill="#f3f6f6"')+rect(210,125,120,55,'fill="#dbe9e8"')+rect(405,200,145,80,'fill="#dbe9e8"')
        s+=label(160,345,'A · fixed datum',18)+label(270,160,'feature 1',18,'middle')+label(477,245,'feature 2',18,'middle')
        s+=dimension(145,55,620,55,'OVERALL LENGTH',380,38)+line(145,325,210,125,'stroke-dasharray="5 5"')
        s+=label(400,382,'Name endpoints • Locate edges or centers • Show units',18,'middle')
    elif kind in ('takeoff','envelope'):
        s=rect(190,70,390,240,'fill="#e3efed"')
        for x in [320,450]: s+=line(x,70,x,310,'stroke-dasharray="5 5"')
        s+=line(190,190,580,190,'stroke-dasharray="5 5"')
        if kind=='envelope':s+=rect(350,130,90,115,'fill="white"')+label(395,191,'opening',16,'middle')
        s+=label(400,348,'SURFACE → area → pieces → purchase cost',20,'middle')+label(400,379,'BOUNDARY → length → stock cutting plan',20,'middle')
    elif kind=='centers':
        s=rect(105,145,590,90,'fill="#edf3f4"')
        for i,x in enumerate([155,275,395,515,635]):s+=line(x,118,x,260,'stroke-dasharray="5 4"')+label(x,107,str(i+1),20,'middle')
        for x in [155,275,395,515]:s+=dimension(x,280,x+120,280,'gap',x+60,312)
        s+=label(400,55,'5 CENTERS • 4 INTERVALS',26,'middle')+label(400,370,'Locate every center from one datum',20,'middle')
    elif kind=='stock':
        s=rect(90,125,620,90,'fill="#edf3f4"')
        for x in [225,370,515]:s+=rect(x,125,12,90,'fill="#b24332" stroke="none"')
        for x in [150,300,445]:s+=label(x,175,'part',20,'middle')
        s+=label(620,175,'leftover',18,'middle')+label(400,70,'STOCK = PARTS + CUT LOSS + LEFTOVER',23,'middle')
        s+=label(400,272,'Red bands represent a stated cutting allowance',19,'middle')+label(400,320,'Check whole pieces fit before buying stock',22,'middle')
    elif kind=='beam':
        s=rect(140,215,95,100,'fill="#dbe9e8"')+rect(565,215,95,100,'fill="#dbe9e8"')+line(185,207,615,207,'stroke-width="12"')
        s+=line(400,70,400,180,'marker-end="url(#a)" stroke-width="4"')+label(435,125,'same load',20)
        s+=dimension(235,345,565,345,'SUPPORT SPAN',400,380)+label(400,255,'measure midspan change',18,'middle')
    elif kind=='bearing':
        s=rect(150,150,90,105,'fill="#edf3f4"')+rect(500,150,90,105,'fill="#edf3f4"')+rect(145,255,100,30,'fill="#dbe9e8"')+rect(440,255,210,30,'fill="#dbe9e8"')
        s+=line(90,286,710,286)+label(197,323,'smaller contact area',18,'middle')+label(545,323,'larger contact area',18,'middle')
        for x in [195,545]:s+=line(x,60,x,130,'marker-end="url(#a)"')
        s+=label(400,40,'SAME LOAD • DIFFERENT CONTACT AREA',23,'middle')+label(400,375,'Average pressure = force ÷ contact area',22,'middle')
    elif kind=='slope':
        s=line(115,100,685,100,'stroke-dasharray="7 5"')+label(400,77,'CHECKED LEVEL REFERENCE',23,'middle')+line(160,180,620,285,'stroke-width="8"')
        s+=line(160,100,160,180,'marker-end="url(#a)"')+line(620,100,620,285,'marker-end="url(#a)"')+label(129,160,'A',20)+label(646,285,'B',20)
        s+=dimension(160,330,620,330,'HORIZONTAL RUN',390,365)+label(665,185,'drop',17)
    elif kind=='route':
        s=rect(190,65,410,280,'fill="#f6f8f8"')+rect(190,105,410,50,'fill="#c4d9de"')+rect(325,215,150,90,'fill="#d4d7e9"')
        s+=label(395,137,'UPPER ROUTE',21,'middle')+label(400,190,'required gap',18,'middle')+label(400,250,'LOWER',20,'middle')+label(400,279,'ROUTE',20,'middle')
        s+=label(400,378,'Budget every thickness, gap, support, and fall',20,'middle')
    elif kind=='flow':
        s=rect(150,65,180,160,'fill="#e0f0f5"')+line(330,205,465,205,'stroke-width="8"')+line(465,205,465,250,'marker-end="url(#a)"')+rect(415,260,180,85,'fill="#e0f0f5"')
        s+=label(240,117,'start level',20,'middle')+label(505,314,'collected mL',20,'middle')+label(400,384,'FLOW RATE = VOLUME ÷ TIME',24,'middle')
    elif kind=='thermal':
        s=line(155,310,665,310)+line(155,310,155,60)+label(400,363,'elapsed time (min)',20,'middle')+label(175,54,'temperature (°C)',20)
        s+='<path d="M160 100 Q350 205 625 250" fill="none" stroke="#2d7177" stroke-width="5"/><path d="M160 100 Q350 153 625 185" fill="none" stroke="#866190" stroke-width="5"/>'
        s+=label(405,110,'Compare from similar starts',19)+label(400,395,'Illustration only — plot your own readings or supplied dataset',16,'middle')
    elif kind=='circuit':
        s=line(170,115,350,115)+line(350,115,415,70)+line(435,115,625,115)+line(625,115,625,300)+line(625,300,170,300)+line(170,300,170,225)+line(170,180,170,115)
        s+=line(130,180,210,180,'stroke-width="4"')+line(145,225,195,225,'stroke-width="4"')+label(80,210,'source',18,'middle')
        s+='<circle cx="625" cy="210" r="35" fill="white"/><path d="M600 185 L650 235 M600 235 L650 185"/>'
        s+=label(385,155,'switch',20,'middle')+label(695,215,'load',20,'middle')+label(400,370,'A closed conducting path returns to the source',22,'middle')
    elif kind=='energy':
        for x,title,sub in [(60,'POWER','V × A = W'),(315,'TIME','hours'),(570,'ENERGY','W × h = Wh')]:
            s+=rect(x,125,180,150,'fill="#e3efed" rx="12"')+label(x+90,180,title,24,'middle')+label(x+90,225,sub,19,'middle')
        s+=label(277,210,'×',30,'middle')+label(527,210,'=',30,'middle')+label(400,345,'1,000 Wh = 1 kWh',24,'middle')
    else: # template
        s=rect(175,70,450,270,'fill="#e3efed"')+rect(205,100,390,210,'fill="white" stroke-dasharray="8 5"')
        s+=label(400,193,'TEMPLATE / PART',26,'middle')+label(400,230,'opening − two edge gaps',22,'middle')+label(400,374,'Measure the opening • State the gap • Test the fit',20,'middle')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="410" viewBox="0 0 800 410" role="img"><title>{e(kind)} teaching diagram</title><defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#25434e"/></marker></defs><rect width="800" height="410" rx="16" fill="#fff"/><g stroke="#25434e" stroke-width="2" fill="none">{s.replace("<text ","<text fill=\"#203c48\" stroke=\"none\" font-family=\"Arial,sans-serif\" ")}</g></svg>'

for kind in sorted(set(j['diagram'] for j in JOBS)):
    (PUBLIC/(kind+'.svg')).write_text(diagram(kind))

units=[];targets=[];lessons=[];plans={};tasks=[];counts={}
vocab=[{'term':'datum','definition':'A named starting point or reference used for related measurements.'},{'term':'clearance','definition':'Intentional space between parts or between a part and its surroundings.'},{'term':'allowance','definition':'Extra material or space included for a stated purpose.'},{'term':'NTS','definition':'Not to scale: use the written dimensions, not a ruler on the sketch.'},{'term':'acceptance check','definition':'A stated measurement or test used to decide whether the job meets its requirements.'},{'term':'revision','definition':'A documented change to a design or record after checking evidence.'}]
rubric={
 'science':{'description':'Uses the relevant physical relationship accurately and distinguishes the model from the real system.'},
 'reasoning':{'description':'Shows individual calculations with units, checks a result, and uses test evidence for a decision.'},
 'communication':{'description':'Supplies a dated, dimensioned, usable drawing/work order and a traceable material or test record.'},
 'transfer':{'description':'Independently responds to a changed requirement and revises the product or recommendation.'}}
for n,(title,desc,count) in enumerate(UNITS,1):
    uid=f'trades-reset-{n}'
    units.append(dict(id=uid,name=f'Phase {n}: {title}',description=desc,order_index=n,program='trades',allotted_days=count*2,default_start_date='2026-09-21' if n==1 else None))
    plans[uid]=[]
    for ix,(slug,domain,strand,statement) in enumerate(TARGETS[n-1],1):
        targets.append(dict(slug=f'tr26.p{n}.{slug}',statement=statement,domain=domain,unit_id=uid,content_strand=strand,program='trades',order_index=ix,exclude_from_growth=False))
    tasks.append(dict(slug=f'tr26.p{n}.performance',unit_id=uid,program='trades',prompt=f'Use your {title.lower()} project to show a checked measurement, an individual vocational calculation, a usable drawing, and a test-based revision. Independently solve a changed condition supplied by your teacher. Cite notebook pages and distinguish measured, supplied, and assumed values.',rubric=rubric))

def paras(text): return '<p>'+e(text)+'</p>'
def ol(items): return '<ol>'+''.join('<li>'+e(s)+'</li>' for s in items)+'</ol>'
def section(title,body):return '<h2>'+e(title)+'</h2>'+body
student_print=[]
for number,j in enumerate(JOBS,1):
    u=j['unit'];uid=f'trades-reset-{u}'; counts[u]=counts.get(u,0)+1;day=counts[u]
    slug=f'mvp-job-{number:02d}'; ident=str(uuid.uuid5(uuid.NAMESPACE_URL,'https://www.antocciphysics.com/lessons/'+slug))
    target_slugs=[f'tr26.p{u}.{t[0]}' for t in TARGETS[u-1]]
    mins=[15,12,28,23,21,11] if number==1 else [12,18,20,28,20,12]
    stages=['Brief','Measure','Plan','Make','Test','Explain']
    leads=[j['product'],'Collect the information the job needs. Keep sources and units visible.','Work out the dimensions and decisions before making.','Build or lay out the job from the current drawing.','Inspect the result against the stated requirements.','Show what you can explain independently, then hand over your work.']
    directions=[
        [j['launch'],'Set up a dated notebook spread: sketch and readings on the left; calculation, decision, test, and revision on the right. Mark small sketches NTS unless drawn to a chosen scale.','Work in pairs and rotate roles. Each student keeps an individual notebook and performs a tool action and a calculation.'],
        j['survey'],j['plan'],j['make'],j['check'],
        ['Complete the individual exit below before discussing answers.','Add the test result, revision, and notebook page reference to your response. Use the notebook as evidence rather than retyping every page.','Save the three selected responses and submit the lesson for teacher review. Show your physical work and notebook to the teacher. Clean up and return shared supplies.']]
    notebooks=[
        'Write the job title, date, user/purpose, and your prediction. Keep the Chromebook on the desk while you measure or build.',
        'Record readings, endpoints/reference, units, and source. Label values measured, supplied, calculated, or assumed.',
        'Show operations with units, a labeled drawing, and your work order or decision. Keep original and revised work readable.',
        'Record a build issue or clarification as it occurs. Your product and notebook are the work for this stage.',
        'Record requirement → test/reading → decision → revision → retest. Keep unexpected results; do not invent success.',
        'Use your own calculation and observed evidence. If you used a supplied-data alternative, say so.']
    record_prompt='Record one critical dimension or quantity for this job, with units, endpoints/reference or condition, and its source (measured or supplied). Give your check or one uncertainty. Add the notebook page/date so your teacher can find the full record.'
    math_prompt='Share one calculation that controls YOUR job: the given values, operation, answer with units, and what the answer tells your builder or inspector. Use your actual design or the assigned classroom case; identify the source. Keep the full drawing and work in your notebook.'
    if number==1:
        record_prompt='Enter YOUR closed notebook length and width in inches, the tape resolution, and whether the partner check agreed. Record full readings and the sketch in your notebook.'
        math_prompt='Enter YOUR planned inside base L × W and outer blank L × W, with units. Show one dimension calculation using two 1/8-in gaps and two 3/4-in walls. Keep the complete work order and drawing on paper.'
    captures={1:('record',record_prompt,target_slugs[0],'diagnostic' if number<3 else 'main'),2:('calculation',math_prompt,target_slugs[1],'main'),5:('exit',j['exit']+' Include a notebook page/date and one actual test result or clearly labeled supplied-data conclusion.',target_slugs[3],'exit')}
    blocks=[]
    for i in range(6):
        bid=f'{slug}-{stages[i].lower()}'
        workshop=dict(pageBreakBefore=True,stage=stages[i],title=(j['title'] if i==0 else stages[i]+' the job'),lead=leads[i],minutes=mins[i],notebook=notebooks[i],steps=directions[i],purpose='Use measurement and vocational mathematics to produce work another person can check.',catchUp=[j['support'] or 'Sketch the situation first. Label known values and units; explain the operation aloud before calculating.',j['alternative'] or 'If you are absent, use a reachable object or supplied classroom case with teacher guidance. Mark the source; leave unperformed tests labeled pending.'])
        blocks.append(dict(id=bid,type='prose',markdown=leads[i],workshop=workshop,teachingMoment=dict(phase=['launch','investigate','model','investigate','discuss','exit'][i],title=stages[i],purpose=leads[i]),teachingTool=dict(kind='case-board',version=1,frames=[dict(title=j['title'],image=f'/trades-reset/{j["diagram"]}.svg',alt=f'{j["diagram"].title()} diagram: '+j['model'][1],prompt=directions[i][0],body='Teaching representation • use the dimensions in your job brief and your checked notebook readings.')])))
        if i==0:
            blocks.append(dict(id=bid+'-materials',type='callout',variant='note',title='Tools and finished product',markdown='**Materials:** '+j['materials']+'\n\n**Hand over:** '+j['product']))
            if j['alternative']:blocks.append(dict(id=bid+'-alternative',type='callout',variant='note',title='If the equipment is not available',markdown=j['alternative']))
            if number==1:blocks.append(dict(id=bid+'-print',type='prose',markdown='[Open the printable student job](/trades-reset/day-1-student-job.pdf). Keep this beside your notebook while working.'))
        if i==2:
            prompt,eq,answer=j['model']
            blocks.append(dict(id=bid+'-example',type='worked_example',prompt=prompt,equation=eq,work=answer,answer='Check which numbers belong to this example and which belong to your own job.'))
        if i==4 and j['extend']:blocks.append(dict(id=bid+'-extension',type='callout',variant='tip',title='If your job is ready',markdown=j['extend']))
        if i in captures:
            suffix,prompt,target,role=captures[i]
            capture=dict(id=f'{slug}-{suffix}',type='exit_ticket' if i==5 else 'question',capture=True,targetId=target,requiredForCompletion=True,evidenceRole=role,xp=0 if number<3 else 10,workshop=dict(taskLabel={'record':'Save one checked record','calculation':'Save the deciding calculation','exit':'Individual exit and evidence'}[suffix],purpose='This short record points your teacher to the physical work and shows your own reasoning.'),sei=dict(visualBlockId=bid,frames=[dict(level=1,text='My value is ___ (units). It is measured / supplied. I checked it by ___.' if i==1 else 'I used ___ to calculate ___. My result is ___ (units). This means ___.' if i==2 else 'My calculation is ___. My evidence is ___. I changed / kept ___ because ___.'),dict(level=2,text='The evidence supports ___ because ___. A limit is ___.')],wordBank=['dimension','datum','units','clearance','calculate','check','revise'],talkFirst=False))
            if i==5:capture['prompt']=prompt
            else:capture['question']=dict(prompt=prompt)
            blocks.append(capture)
    doc=dict(schemaVersion=1,presentation='trades-workshop',dayType='WORKSHOP',lessonKind='daily',blocks=blocks)
    lessons.append(dict(id=ident,slug=slug,title=f'Job {number:02d} · '+j['title'],description=j['product'],unit=units[u-1]['name'],unit_id=uid,lesson_number=day,lesson_type='markdown',estimated_time=110,planned_days=2,published=True,visibility_track=None,objectives=[t[3] for t in TARGETS[u-1]],content_blocks=doc))
    time=0;timing=[]
    for ix,m in enumerate(mins):timing.append(f'{time}–{time+m} min · {stages[ix]}: '+directions[ix][0]);time+=m
    teacher=section('The job',paras(j['product'])+paras('110 minutes / two periods. Project-based vocational mathematics. Chromebook guides six stages; pocket notebook holds drawings, measurements, calculations, test results, and revisions. Three selected digital responses; no duplicate digital drawing required.'))
    teacher+=section('Prepare',paras(j['materials'])+paras(j['prep'] or 'Prepare one sample or diagram; approve the work area and verify the model arithmetic before class.')+(paras('Equipment alternative: '+j['alternative']) if j['alternative'] else ''))
    teacher+=section('Learning evidence',ol([t[3] for t in TARGETS[u-1]])+paras('Use direct observation for tool action and product/drawing evidence. Digital saves and XP are participation records, not mastery ratings. First two jobs establish a baseline: independent / with cue / not observed. Keep existing grading policy; do not turn a group product into every student’s individual rating.'))
    teacher+=section('110-minute sequence',ol(timing))
    for ix,stage in enumerate(stages):teacher+=section(stage,ol(directions[ix])+paras('Notebook: '+notebooks[ix]))
    teacher+=section('Worked vocational math',paras(j['model'][0])+paras(j['model'][1])+paras(j['model'][2]))
    teacher+=section('Digital checkpoints',ol([record_prompt,math_prompt,j['exit']]))
    teacher+=section('Teacher answer key and interpretation',paras(j['key']))
    teacher+=section('Inspect, support, extend',ol(j['check'])+paras('Support: '+(j['support'] or 'Provide a labeled sketch, fraction/unit reference, oral rehearsal, or simpler initial values. Retain the same job and acceptance check.'))+paras('Extension: '+(j['extend'] or 'Repeat with a changed dimension and explain whether the original method still works.')))
    teacher+=section('Individual review',paras('Look for: a checked tool reading; a justified calculation with units; a usable drawing/product; a test-based decision. Record missing evidence as not observed. Give one actionable next step and a chance to revise. Use the phase performance task for a later individual conference.'))
    teacher+=paras(f'Student lesson: /lessons/{slug} · Source revision: MVP Engineering reset 2026-09-21.')
    plans[uid].append(dict(day=day,title=f'Job {number:02d} · '+j['title'],bodyHtml=teacher,kind='daily',lessonId=ident))
    printbody='<article><h1>'+e(f'Job {number:02d} · '+j['title'])+'</h1>'+paras(j['product'])+paras('110 minutes • Tape measure + pocket notebook • Name: __________________ Date: __________')+paras('Materials: '+j['materials'])
    if j['alternative']: printbody+=paras('Equipment alternative: '+j['alternative'])
    printbody+=f'<img alt="{e(j["diagram"])} diagram" src="{j["diagram"]}.svg"/>'
    for ix,stage in enumerate(stages):
        printbody+=section(stage+' · '+str(mins[ix])+' min',ol(directions[ix]))
        if ix==2:printbody+=section('Worked example',paras(' '.join(j['model'])))
    printbody+=section('Individual exit',paras(j['exit']))+'</article>'
    (PUBLIC/(slug+'.html')).write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+e(j['title'])+'</title><style>body{font:17px/1.5 system-ui;max-width:780px;margin:35px auto;padding:0 20px;color:#19343f}h1{font-size:32px}h2{font-size:22px;margin-top:28px}img{max-width:100%;height:230px}li{margin:8px 0}@media print{body{font-size:11pt;margin:0}h2{break-after:avoid}li{break-inside:avoid}img{height:170px}}</style>'+printbody+'</html>')
    student_print.append((number,j['title'],slug))

save('units.json',units);save('targets.json',targets);save('lessons.json',lessons);save('mastery-tasks.json',tasks);save('jobs.json',JOBS)
(ROOT/'src/data/trades-reset-plans.json').write_text(json.dumps(plans,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/data/trades-reset-units.json').write_text(json.dumps({u['id']:u['name'] for u in units},ensure_ascii=False,indent=2)+'\n')
index='<h1>MVP Engineering · Project course</h1><p>36 core meetings of 110 minutes (66 hours), plus flexible practice and revision time. This is a sequence, not a claim about the school calendar. Keep the notebook as the work record; the app collects three selected responses per job.</p><p><a href="day-1-student-job.pdf">Day 1 printable student job</a> · <a href="day-1-teacher-plan.pdf">Day 1 teacher plan</a></p>'
for u in units:
    index+='<h2>'+e(u['name'])+'</h2><ol start="'+str(next(i for i,j in enumerate(JOBS,1) if j['unit']==u['order_index']))+'">'
    for n,title,slug in student_print:
        if JOBS[n-1]['unit']==u['order_index']:index+=f'<li><a href="/lessons/{slug}">{e(title)}</a> · <a href="{slug}.html">print directions</a></li>'
    index+='</ol>'
index+='<h2>Prepare later equipment</h2><p>Before jobs 18–19: checked levels and low model supports. Before job 22: contained flow setup. Before jobs 24–25: thermometers, matching containers, safe warm water. Before jobs 26–28: approved low-voltage source, lamps, leads, switches, and meters if taught. Paper/supplied-data alternatives are included and clearly labeled.</p>'
(PUBLIC/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MVP Engineering project curriculum</title><style>body{font:18px/1.6 system-ui;max-width:850px;margin:40px auto;padding:0 24px;color:#19343f}a{color:#255e75}li{margin:10px 0}h1{font-size:38px}h2{margin-top:36px}</style>'+index+'</html>')
print(f'Built {len(units)} phases, {len(lessons)} jobs, {len(targets)} targets, {len(tasks)} performance tasks; six stages and three captures per job.')
