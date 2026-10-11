"""Build teacher activity presets from the published classroom decks.

Run with Python + lxml from the app root. This never includes speaker notes or
solution slides. The catalog is independent of video lesson numbering.
"""
import json, re, subprocess
from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
def text(node):
    return re.sub(r'\s+', ' ', node.text_content()).strip()
def parse(file):
    return html.fromstring(file.read_text())
def plain(markup):
    node = html.fragment_fromstring(markup, create_parent='div')
    for el in node.xpath('.//script|.//style|.//svg|.//figure|.//*[contains(@class,"sentence-stem")]'):
        el.drop_tree()
    for br in node.xpath('.//br'): br.tail = '\n' + (br.tail or '')
    for el in node.xpath('.//p|.//li|.//tr|.//div[@class="equation"]'):
        el.tail = '\n' + (el.tail or '')
    for el in node.xpath('.//th|.//td'): el.tail = ' | ' + (el.tail or '')
    return '\n'.join(re.sub(r'\s+', ' ', line).strip(' |') for line in node.text_content().splitlines() if line.strip())

authored = json.loads(subprocess.check_output(['node','--input-type=module','-e',
    "import{lessons}from'./src/data/deck-sources/unit-1-teaching/lessons.mjs';import{cpaLessons}from'./src/data/deck-sources/unit-1-teaching/cpa-lessons.mjs';import{enhance}from'./src/data/deck-sources/unit-1-teaching/enhancements.mjs';enhance(lessons);console.log(JSON.stringify({honors:lessons,cpa:cpaLessons}));"], cwd=ROOT))
u1 = ['anchor-know-unknow','vocab-position-distance-displacement','capture-pt-graph','read-vt-graph-components','predict-position-uncertainty','vectors-tip-to-tail','acceleration-rate-of-change','pick-equation-of-motion','newtons-first-law-inertia','identify-forces','lab-accel-vs-mass','lab-accel-vs-force','fma-solve-net-force','third-law-pairs','draw-fbd','net-force-from-fbd','friction-static-kinetic','equilibrium-find-unknown','workshop-self-diagnose','d20-locate-the-arc','d22-honors-transfer','d22-honors-transfer']
u2 = ['anchor-why-bend','free-fall-g','mass-vs-weight','k1-universal-gravitation','s1-compute-gravitation','k2-field-strength','r3-compare-g','s4-vernier-measure-g','k3-projectile-independence','s2-projectile-calc','r2-predict-landing','s3-centripetal-calc','k5-orbit-free-fall','k4-keplers-laws','r4-closest-approach','transfer-task']
catalog = []
def add(unit, day, track, src, slide, title, prompt, target, kind='solo', visual=False):
    prompt = prompt.strip()
    if title!='Exit ticket': prompt=title+'\n\n'+prompt
    assert 0 < len(prompt) <= 1000, (unit,day,track,title,len(prompt))
    catalog.append(dict(id=f'{unit}-{day}-{track}-{slide}-{kind}',unitId=unit,day=day,track=track,src=src,slide=slide,title=title,prompt=prompt,targetSlug=target,kind=kind,usesVisual=visual))

for track, lessons in authored.items():
    folder='unit-1-cpa' if track=='cpa' else 'unit-1-teaching'
    for lesson in lessons:
        day=lesson['day']; src=f'/decks/{folder}/day-{day:02}.html'
        sections=parse(ROOT/'public'/src.lstrip('/')).xpath('//section[@data-title]')
        questions={s['title'] for s in lesson['slides'] if s.get('answer')}
        for index,section in enumerate(sections,1):
            if section.get('data-solution')=='true' or index<=2: continue
            title=section.get('data-title'); content=section.xpath('./div[@class="content"]')[0]
            if title=='Independent exit evidence':
                add('unit-1',day,track,src,index,'Exit ticket',lesson['exit'],'u1.'+u1[day-1],'exit_ticket');continue
            prompt=plain(html.tostring(content,encoding='unicode'))
            ask = re.search(r'\?|\b(?:[Pp]redict|[Ee]xplain|[Dd]raw|[Ss]ketch|[Cc]alculate|[Ff]ind|[Cc]ompare|[Dd]escribe|[Ww]rite|[Nn]ame|[Cc]hoose|[Ss]tate|[Pp]oint to|[Ii]dentify|[Rr]ecord|[Cc]omplete|[Ss]how|[Ss]ubmit|[Ss]olve)\b',prompt)
            if title not in questions and not ask: continue
            if title in ['Self-assessment uses the four dimensions','Final submission','For steady velocity','A method is a choice with a reason','Step 1: draw the forces','A repeatable drawing routine','Keep a component from becoming an extra force','Use the provided math supports','Make the work readable','Use partner feedback carefully','Separate physics from the decision','A coordinate system makes position precise','Two ways to describe the same route','Tip-to-tail addition','Components add along matching axes','Constant acceleration is an assumption','A repeatable solution structure','A force describes an interaction','The system includes the hanging mass','A diagram is a force inventory','Axes along and perpendicular to a ramp','Allowed resources and independent work','Feedback names evidence']: continue
            visual=bool(content.xpath('.//svg|.//*[@data-chart]|.//*[@data-sim]'))
            # Text graphs supply the coordinates even when the display is switched to the activity.
            for c in content.xpath('.//*[@data-chart]'):
                chart=json.loads(c.get('data-chart'))
                prompt+='\nGraph values: '+str(chart.get('labels',chart.get('kind','')))+'; '+str(chart.get('data',''))
            # Keep the model's visible labels/caption with the response prompt, since
            # launching an activity temporarily replaces the projected slide.
            figures=content.xpath('.//figure')
            model='\n'.join(text(f) for f in figures)
            if visual and model and len(prompt)+len(model)+len(title)<960:
                prompt+='\nModel: '+model
            add('unit-1',day,track,src,index,title,prompt,'u1.'+u1[day-1],visual=visual)

for file in sorted((ROOT/'public/decks/classroom').glob('U2 Day*.html'),key=lambda f:int(f.name.split()[2])):
    day=int(file.name.split()[2]); src='/decks/classroom/'+file.name
    for index,s in enumerate(parse(file).xpath('//section'),1):
        label=s.get('data-label',''); target='u2.'+u2[day-1]
        if label=='Do Now':
            prompt=re.sub(r'^DO NOW · \d+ MIN\s*','',text(s)).split('→ PACKET')[0].strip()
        elif label.startswith('Exit Ticket'):
            prompt=text(s.xpath('.//p')[0]); add('unit-2',day,'shared',src,index,'Exit ticket',prompt,target,'exit_ticket');continue
        elif 'Worked' in label or label=='Worked Example':
            ps=s.xpath('.//p'); prompt=text(ps[0]) if ps else ''
            # The first paragraph poses the problem. GIVEN values are needed, solutions are excluded.
            given=s.xpath('.//div[normalize-space(text())="GIVEN"]/following-sibling::*[1]')
            if given: prompt+='\nGiven: '+text(given[0])
            if day==4: prompt+='\nUse G = 6.67 × 10⁻¹¹ N·m²/kg² and Earth mass 5.97 × 10²⁴ kg.'
            if day==5: prompt+='\nUse G = 6.67 × 10⁻¹¹ N·m²/kg²; Earth mass 5.97 × 10²⁴ kg; Moon mass 7.35 × 10²² kg; separation 3.84 × 10⁸ m.'
            if day==6: prompt+='\nUse G = 6.67 × 10⁻¹¹ N·m²/kg²; M = 5.97 × 10²⁴ kg; R = 6.37 × 10⁶ m.'
            if day==11: prompt='A projectile launches at 20 m/s at 30° above level ground. Find horizontal and vertical velocity, flight time, and range. Ignore air resistance; use g = 9.81 m/s².'
        elif any(word in label for word in ['Live Sim','Investigation','Observation','Practice','Your Turn','Notice','Demo','Honors','Gather','Station Rotation']):
            # Preserve visible student instructions; discard footer, packet pointers and embedded simulations.
            for el in s.xpath('.//footer|.//svg|.//script|.//style|.//iframe|.//*[contains(text(),"→ PACKET")]'):
                el.drop_tree()
            prompt='\n'.join(text(p) for p in s.xpath('.//p'))
            if not prompt: prompt=text(s)
            prompt=re.sub(r'\s*U2 · \d+/\d+\s*$','',prompt)
            if label=='Honors · The Leaking Cup': prompt='An astronaut floats inside the ISS. Why? Choose and explain: (a) there is no gravity there, (b) it is too far from Earth, or (c) another reason. Predict what happens to water leaking from a cup while the cup is in free fall.'
        else: continue
        if prompt and '{{' not in prompt:
            add('unit-2',day,'shared',src,index,label,prompt,target)

# Complete classroom prompts where the source uses a visual card or shared data.
extras = {
 (1,7): ("The unit’s question", "Write one question about gravity that could help us investigate whether the fictional asteroid’s path bends toward Earth."),
 (3,4): ('Mass and weight', 'You would weigh less on the Moon. Did your mass change? What changed? Explain the distinction.'),
 (3,8): ('Put the asteroid on a scale', 'What information would you need to find the weight of 2026-XJ near Earth? Explain why its mass alone is not enough.'),
 (4,5): ('Why squared?', 'Sketch spheres of radius r and 2r. How does the surface area change? Predict how gravitational field strength changes and explain.'),
 (4,6): ('Predict the change', 'Without recomputing the full force, predict the factor by which gravity changes when separation doubles and when it triples. Show your scaling reasoning.'),
 (5,7): ('Who owns the asteroid?', 'Use your station data to compare the Sun’s and Earth’s pulls on 2026-XJ. Which dominates at the modeled location? How would Earth’s pull change if its separation became five times smaller?'),
 (6,7): ('Why do astronauts float?', 'At 400 km altitude, g is about 8.7 N/kg. Explain why astronauts float despite that gravitational field.'),
 (7,4): ('Graph gravitational field strength', 'Compute g at altitudes 0, 100, 1,000, 10,000 and 384,000 km. Use G = 6.67 × 10⁻¹¹ N·m²/kg², Earth mass 5.97 × 10²⁴ kg, and Earth radius 6.37 × 10⁶ m. Sketch g versus altitude. Estimate the altitudes where g is half, 10%, and 1% of its surface value.'),
 (7,6): ('What if gravity vanished?', 'Predict the ISS’s path if Earth’s gravity suddenly vanished. Explain why the actual path is different.'),
 (8,4): ('Plan the measurement', 'Describe how you will use the slope of a falling ball’s velocity–time graph to measure g. Identify the part to fit and one precaution that protects the sensor.'),
 (8,6): ('Match your precision', 'Trial slopes are 9.52, 9.78 and 9.75 m/s². Calculate their average. Use the spread to choose sensible precision and explain whether these measurements are consistent with 9.81 m/s².'),
 (8,7): ('Use your trial data', 'Report three measured slopes with units, the drop height, and a note about each release. Find the average and explain which trial is least reliable, if any.'),
 (8,8): ('Sources of error', 'Consider a ball drifting off the sensor axis, a small toss at release, air resistance, and too few sample points. Which could give a low or high estimate of g? Rank the likely effects and justify your reasoning.'),
 (10,7): ('Flyby prediction', 'How could a horizontal-launch model help describe a close asteroid flyby? Identify the roles of horizontal motion and gravity, and one limitation of the model.'),
 (12,7): ('Two numbers that match', 'At 400 km altitude, a satellite moves at about 7,700 m/s. Use Earth radius 6.37 × 10⁶ m to compute v²/r. Compare it with g ≈ 8.7 m/s² at that altitude. Explain what the agreement suggests.'),
 (13,9): ('Sim versus theory', 'Report the circular-orbit speed you found in the simulation at 400 km altitude. Calculate the theoretical speed using G = 6.67 × 10⁻¹¹ N·m²/kg², Earth mass 5.97 × 10²⁴ kg, and Earth radius 6.37 × 10⁶ m. Compare the two and explain any difference.'),
 (15,7): ('Compare the two models', 'Compare the Unit 1 constant-velocity prediction with the Unit 2 gravity-and-orbit prediction. Which assumptions changed? Explain why the second model can describe a curved path, and identify uncertainty that remains.'),
 (16,4): ('Transfer task checkpoint', 'Choose one problem from your assigned transfer task: gravitational force, angled projectile, orbital speed, or Kepler’s third law. State the given values, select the model, and justify your first step. Use the numerical values on your task sheet.'),
 (16,6): ('Look ahead', 'Predict one thing about 2026-XJ that you could not have predicted at the end of Unit 1. Explain which new physics tool supports your claim.'),
}
overrides = {
 (1,5): 'Write one question about gravity that physics can investigate. Explain what observation or measurement would help answer it.',
 (2,6): 'Predict the time for an object to fall 100 m from rest, ignoring air resistance. Show your model, calculation, and units. Compare with a shorter fall and explain why time does not scale directly with height.',
 (4,7): 'Hold both masses fixed. Predict how gravitational force changes when separation doubles, then test with the model. Report the predicted factor, observed factor, and explanation.',
 (5,6): 'Predict how gravity changes when separation is halved, doubled, and tripled. Check each prediction with the model. Explain any correction.',
 (8,5): 'Examine the falling portion of today’s velocity–time graph. What does its slope tell you? Explain how you would select the interval for a reliable fit.',
 (9,4): 'A ball is dropped while an identical ball is launched sideways from the same height at the same instant. Predict whether increasing horizontal launch speed changes their falling times. Explain and compare with the model.',
 (9,7): 'Compare two horizontal launches: 10 m/s from 5 m high, and 8 m/s from 20 m high. Predict which stays in the air longer and which travels farther. Calculate both times and ranges; ignore air resistance.',
 (10,5): 'Rank these horizontal launches by range before calculating: A: 5 m high, 5 m/s; B: 20 m high, 10 m/s; C: 50 m high, 20 m/s; D: 100 m high, 20 m/s. Find fall time and range for each. Ignore air resistance.',
 (12,5): 'A ball moves in a circle on a string. Predict its path just after the string is cut. Describe or sketch the velocity and net force before and after the cut, and explain.',
 (13,4): 'Predict how a horizontally launched cannonball’s path changes as launch speed increases. Use the model to compare a crash, a circular orbit, and escape. Explain why an orbiting ball still falls.',
 (14,7): 'Use T² = a³ for orbits around the Sun (T in years, a in AU). Find the periods for Earth at 1.00 AU, Mars at 1.52 AU, and fictional 2026-XJ at 1.42 AU. Compare and explain the trend.',
}
for a in catalog:
    if a['unitId']=='unit-2':
        key=(a['day'],a['slide'])
        if key in overrides: a['prompt']=a['title']+'\n\n'+overrides[key]
        if a['day']==6 and a['kind']=='exit_ticket': a['prompt']+='\nUse altitude 400 km, Earth radius 6.37 × 10⁶ m, Earth mass 5.97 × 10²⁴ kg, and G = 6.67 × 10⁻¹¹ N·m²/kg².'
for (day,slide),(title,prompt) in extras.items():
    catalog=[a for a in catalog if not(a['unitId']=='unit-2' and a['day']==day and a['slide']==slide)]
    f=next((ROOT/'public/decks/classroom').glob(f'U2 Day {day} -*'))
    add('unit-2',day,'shared','/decks/classroom/'+f.name,slide,title,prompt,'u2.'+u2[day-1])

# Assessment deck has no dedicated exit slide; use an evidence-based session checkpoint.
f=next((ROOT/'public/decks/classroom').glob('U2 Day 16*.html'))
add('unit-2',16,'shared','/decks/classroom/'+f.name,7,'Exit ticket','Choose one target from today’s transfer task. Explain the method you used, cite a specific calculation or model as evidence, and identify one correction or next step.','u2.transfer-task','exit_ticket')

# Project Physics embeds interactive panels inside three/five deck slides.
# Source-slide numbers refer to those deck slides, not nested widget sections.
project=[
 (11,1,'Predict the walk','Stand 1 m away. Walk away slowly for 3 s, stop for 2 s, then walk back fast. Sketch the position–time graph before viewing the walk. Describe the three parts of your prediction.','sketch-first'),
 (11,2,'Compare sketch and evidence','Compare your sketch with the trace on the classroom screen. Where do they disagree? What motion does the trace support? Cite a feature of the graph.','read-graph'),
 (11,3,'Explain the graph','Complete and explain: When the position–time line goes up, I am walking ___. Flat means ___. A steeper line means ___ because ___. You may respond in English or Spanish.','read-graph'),
 (11,3,'Exit ticket','Use one feature of today’s position–time graph as evidence. Describe what the person was doing, explain how the graph supports your claim, and name one correction to your original sketch. You may respond in English or Spanish.','read-graph'),
 (13,1,'Which is faster?','Line A rises 2.0 m in 2.0 s. Line B rises 0.5 m in 2.0 s. Which object moves faster? Explain using both the change in position and the time interval.','v-from-slope'),
 (13,2,'Find velocity','A cart is at 2.0 m at t = 1.0 s. It is at 3.0 m at t = 5.0 s. What is its velocity? Show your reasoning and units.','v-from-slope'),
 (13,3,'Area and displacement','Use the velocity and time interval shown in the classroom model. How far does the cart go? Explain why the area under the velocity–time graph gives displacement.','area'),
 (13,4,'Find displacement','A cart moves at 0.40 m/s for 6.0 s. How far does it go? Show your reasoning and units.','area'),
 (13,5,'Compare two graph tools','Which move gives a velocity: slope of position–time, or area under velocity–time? Which gives displacement? Explain why the units make sense.','v-from-slope'),
 (13,5,'Exit ticket','Explain what the slope of a position–time graph tells you and what the area under a velocity–time graph tells you. Use a number and units from today’s cart problems as evidence. You may respond in English or Spanish.','area'),
]
for day,slide,title,prompt,target in project:
    add('proj-1',day,'shared',f'/decks/project-physics/week-1-day-{day%10}.html',slide,title,prompt,'pp.w01.'+target,'exit_ticket' if title=='Exit ticket' else 'solo')

# Spaced retrieval and mixed workshop prompts belong to the concept they assess.
for a in catalog:
    title=a['title'].lower(); day=a['day']
    if a['unitId']=='unit-1':
        if day==19:
            if any(w in title for w in ['vector','components']): a['targetSlug']='u1.vectors-tip-to-tail'
            elif any(w in title for w in ['force pair','interaction']): a['targetSlug']='u1.third-law-pairs'
            elif any(w in title for w in ['force','f = ma']) or (a['track']=='cpa' and a['kind']=='exit_ticket'): a['targetSlug']='u1.fma-solve-net-force'
            elif any(w in title for w in ['slope','graph','negative']): a['targetSlug']='u1.acceleration-rate-of-change' if 'negative' in title else 'u1.capture-pt-graph'
            elif any(w in title for w in ['distance','picture']): a['targetSlug']='u1.vocab-position-distance-displacement'
            elif any(w in title for w in ['prediction','uncertainty','bounds']): a['targetSlug']='u1.predict-position-uncertainty'
        elif day==20 and a['kind']!='exit_ticket':
            a['targetSlug']='u1.fma-solve-net-force' if 'force' in title else 'u1.predict-position-uncertainty'
        if day==20 and a['track']=='cpa' and a['kind']=='exit_ticket':a['targetSlug']='u1.predict-position-uncertainty'
        if day==5 and 'units before' in title:a['targetSlug']='foundations.unit-conversions'
        if day==3 and title in ['same trip, different rates','round-trip rates']:a['targetSlug']='u1.vocab-position-distance-displacement'
        if day==6 and title=='distance around a corner':a['targetSlug']='u1.vocab-position-distance-displacement'
    if a['unitId']=='unit-2' and a['title']=='Do Now' and day in [4,5,6,9,10,11,13,14,15]:
        a['targetSlug']='u2.'+{4:'mass-vs-weight',5:'k1-universal-gravitation',6:'k1-universal-gravitation',9:'k3-projectile-independence',10:'k3-projectile-independence',11:'k3-projectile-independence',13:'s3-centripetal-calc',14:'k5-orbit-free-fall',15:'k4-keplers-laws'}[day]
catalog.sort(key=lambda a:(a['unitId'],a['day'],a['track'],a['slide']))

# Give each item a stable unique ID even when two tasks share a source slide.
seen={}
for a in catalog:
    key=a['id']; seen[key]=seen.get(key,0)+1
    if seen[key]>1:a['id']+=f'-{seen[key]}'
output=ROOT/'src/data/deck-activities.json'
output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print(f'{len(catalog)} activities across {len(set(a["src"] for a in catalog))} decks; {sum(a["kind"]=="exit_ticket" for a in catalog)} exit tickets')
