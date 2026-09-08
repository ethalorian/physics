"""Generate explicit CPA-convention Trades teacher plans from reviewed lesson content.
Run with repository root and output directory. Student BlockDocuments stay unchanged.
"""
from pathlib import Path
import json,html,re,sys
APP=Path(sys.argv[1]);OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
lessons=json.loads((APP/'scripts/trades-opening/lessons.json').read_text())
auth={a['slug']:a for a in json.loads((APP/'scripts/trades-course/authoring.json').read_text())}
opening=json.loads((Path(__file__).parent/'opening-teacher-notes.json').read_text())
cases={c['unit']:c for c in json.loads((APP/'scripts/trades-course/cases.json').read_text())}
# Explicit diagnostic follow-ups: observe the named error, then make this teaching move.
checks=[
('Agreement proves accuracy','Ask students to compare a repeated reading against a separate checked reference. Keep the spread and the reference offset as different quantities.'),
('Counting tick marks instead of intervals, or dropping the whole inch','Have the student point to zero, count the spaces in one inch, name the denominator and then add the whole-inch part.'),
('A moving hook must be broken','Return to the intended inside/outside contact surfaces. Inspect and compare a known length before assigning a cause; do not tape or bend the hook.'),
('Three identical readings prove the tool is correct','Put expected and observed values in adjacent columns. Calculate observed minus expected, then test another reference length.'),
('More repeats create finer resolution','Write 1/16 = 0.0625 beside the 0.01-inch requirement. Ask which tool specification and reference check could support the required decision.'),
('Three blocks always equal three complete modules','Draw the two endpoint marks, count the included joints and rebuild the sum from actual units plus those joints.'),
('All half-inch materials have the same outside diameter','Put the copper and EMT reference values side by side. Require the material name before the dimension and calculate their difference.'),
('AWG is a count of manufacturing passes, or diameter and area scale equally','Use the reference areas 3.31 and 2.08 square millimeters. Divide to compare area and return to A = pi d squared / 4.'),
('A nominal-to-actual difference automatically means a defect','Separate the name, actual measurement, specification and allowed interval into four labelled entries. Make the tolerance decision against the specification.'),
('The nominal pipe size is the required hole or space','Circle the complete outside envelope, then add the specified clearances. Compare the total with available space before discussing scale.'),
('A final chain error proves every interval has the same error','Measure or inspect individual intervals. Explain that total divided by count is an average signed deviation, not proof of equal errors.'),
('Sixteen on center means sixteen inches of clear space','Draw two equal-width supports. Mark both centerlines and facing edges, then subtract one support width from center spacing.'),
('The right view repeats the front width','Label width, height and depth on the object. Trace which pair belongs to each view and realign corresponding edges.'),
('Deviation from target equals distance outside tolerance','Mark the target, both limits and the reading on a number line. Compute reading minus target and distance to the nearest violated limit separately.'),
('An as-built should copy the intended dimensions','Keep the issued and observed columns visible. Ask which number another trade needs to describe the actual condition and require a revision note.'),
('Different risers immediately identify the builder as the cause','Use consistent finished-surface endpoints and repeat with a checked setup. Compare finish changes and measurement setup before diagnosing.'),
('A centered bubble guarantees accuracy','Tilt the model to predict the high point, then check contact, vial condition and the instrument. Separate the physical model from confidence in a real reading.'),
('Plumb and equal elevation are interchangeable','Point to the vertical string and the two water surfaces. Ask which reference answers up/down direction and which compares elevation.'),
('The direction alone diagnoses a reversed level','Mark the same location and a room-fixed direction. Compare displacement magnitude in both orientations; follow the instrument-specific check.'),
('Equal diagonals alone prove any quadrilateral is a rectangle','Check the specified side lengths and opposite-side relationship as well. Compare with an isosceles trapezoid as a counterexample.'),
('Slope uses sloped pipe length instead of horizontal run','Sketch a right triangle. Label horizontal run and vertical fall separately, then place the horizontal quantity in the denominator.'),
('One quarter inch per foot is 25 percent or 1:12','Convert a foot to 12 inches first: 0.25/12 = 1/48. Multiply the dimensionless ratio by 100 for percent.'),
('The steepest test result establishes a universal drain rule','List the tested conditions and controlled variables. Ask which systems were not tested and what evidence a broader claim would need.'),
('Only fall consumes the service-zone depth','Build a four-part budget: top clearance, outside diameter, fall and bottom clearance. Compare the sum with the available depth.'),
('A plan view alone communicates the fall','Require a longitudinal section with the same endpoint labels and datum. Recalculate the elevation difference and compare it with the stated slope.'),
('Adding floor thickness increases both end risers the same way','Draw original and finished surfaces. Subtract added thickness at the bottom and add it at the upper landing, using consistent endpoints.'),
('A diagonal fixes every loose frame','Inspect joints and connections. Distinguish a fixed triangle in the model from a slipping fastener or stretching member.'),
('A route conflict permits reducing the required slope','Keep all fixed constraints on the table. Change only the permitted run or depth and report the remaining clearance and missing approvals.'),
('A slope that looks level has no fall','Use measured horizontal run and endpoint elevations. Calculate before and after adjustment; identify which endpoint moves.'),
('A drain fits whenever the fall is less than the bay depth','Require the complete outside-envelope budget for the original and both alternatives. Keep unmodelled fittings and coordination needs explicit.')]
connections=[
('Students begin without a shared measurement method.','A replacement part needs a dimension another person can trust; establish the evidence routine for the fieldhouse survey.'),
('Students have compared readings and named possible causes of disagreement.','Reliable fraction reading supplies the numbers for later drawings and tolerance decisions.'),
('Students can identify the marked division and distinguish length from an endpoint reading.','A checked tool and readable drawing allow a dimension to pass from one trade to another.'),
('Students have inspected hook behavior and practised dimensioning.','Generalize the reference check before trusting a fieldhouse measurement.'),
('Students have practised scale reading and checking a reference.','Choose a tool for the job requirement before using its number to accept a fit.'),
('Students can choose and check an instrument.','A wall module connects actual material and joint dimensions to a predicted layout.'),
('Students have separated a masonry unit from its nominal module.','Extend nominal-versus-actual reasoning to distinct material standards used by different trades.'),
('Students know a material label does not directly state its measured size.','Wire gauge adds a different size convention and connects diameter with cross-sectional area.'),
('Students have met masonry, pipe/conduit and wire conventions.','Build a common vocabulary so a trade handoff distinguishes a name from a tolerance failure.'),
('Students can identify actual dimensions and the governing reference.','Check a complete service envelope and communicate its fit at a stated drawing scale.'),
('Students can make a dimensioned fit sketch.','Compare chain layout with a shared datum before locating multiple wall features.'),
('Students can lay out positions from a fixed reference.','Use support centerlines so adjacent sheet edges share support and dimensions are interpretable.'),
('Students can locate and dimension features from a datum.','Aligned views let another trade reconstruct the same object from the drawing.'),
('Students can read dimensions and communicate shape.','A tolerance decision must distinguish intended value, permitted interval and observed reading.'),
('Students have instrument, layout, drawing and tolerance evidence.','Combine those skills to inspect the mock bay and issue a supported as-built revision.'),
('Students can report dimensions, sources and uncertainty limits from Unit 1.','Apply the same evidence routine to finished stair surfaces; a pattern is the beginning of diagnosis.'),
('Students have compared stair rises and considered measurement setup.','Explain the level vial before interpreting its reading as evidence about an installation.'),
('Students can describe bubble behavior and the need for an instrument check.','Separate vertical direction from equal elevation when establishing a layout reference.'),
('Students have used gravity-based references.','Check the instrument itself before using it to diagnose a wall or pipe.'),
('Students have practised plumb, elevation and level checks.','Establish square with measurements so drawings and physical layouts share the intended geometry.'),
('Students can identify and check reference directions.','A route needs a measured horizontal run and vertical fall to support its slope claim.'),
('Students can calculate fall divided by horizontal run.','Equivalent slope forms let different drawings and trade instructions communicate one requirement.'),
('Students can set and convert a stated slope.','Test a transport claim under controlled conditions and separate model evidence from an installation rule.'),
('Students understand fall, run and slope.','The drain competes for finite service-zone depth, including its diameter and clearances.'),
('Students can calculate a complete route depth budget.','Connect plan and section so another trade can verify elevations and available space.'),
('Students can measure rises and communicate elevation changes.','Predict how finished surfaces change the first and last stair rises before blaming the original layout.'),
('Students can check rectangular geometry.','Investigate how connections and a diagonal constrain a frame and what those observations cannot establish.'),
('Students can calculate slope and a route envelope.','Resolve a conflict using permitted changes while preserving the fixed requirements.'),
('Students can compare route alternatives quantitatively.','Calibrate visual judgment with a prediction, measurement and controlled adjustment.'),
('Students have checked references, geometry, slope and coordination constraints.','Use all of those tools to defend a feasible route or quantify why a proposed route fails.')]
def e(s):return html.escape(str(s),quote=True)
def p(s):return '<p>'+e(s)+'</p>'
def label(k,v):return '<p><strong>'+e(k)+'</strong> '+e(v)+'</p>'
def box(h,body):return '<table><tbody><tr><td>'+phead(h)+body+'</td></tr></tbody></table>'
def phead(s):return '<p><strong>'+e(s)+'</strong></p>'
def table(headers,rows):return '<table><thead><tr>'+''.join('<th>'+e(h)+'</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+v+'</td>' for v in r)+'</tr>' for r in rows)+'</tbody></table>'
def checklist(items):return '<ol>'+''.join('<li>'+e(s)+'</li>' for s in items)+'</ol>'
result={1:[],2:[]}
for l in lessons:
 u=int(l['slug'][2]);n=int(l['slug'][-2:]);ix=(u-1)*15+n-1;b=l['content_blocks']['blocks'];a=auth.get(l['slug']);t=opening.get(l['slug'],{});unit=f'trades-{u}';code=f'{(n-1)//5+1}.{(n-1)%5+1}'
 target=next(x for x in b if x['type']=='target');questions=[x for x in b if x['type']=='question'];q=questions[0];qd=q['question'];exitb=next(x for x in b if x['type']=='exit_ticket' and not x['id'].startswith('audit-'));sk=next((x for x in b if x['type']=='sketch'),None)
 procedures=[x for x in b if x['type']=='procedure'];steps=a['activity'] if a else [s for x in procedures for s in x['steps']];steps=[s if isinstance(s,str) else s.get('text',str(s)) for s in steps]
 work=next((x for x in b if x['type']=='worked_example'),None)
 minutes=a['minutes'] if a else (110 if n in [1,3,5] else 55)
 material=a['materials'] if a else t['materials'];fallback=a['fallback'] if a else t.get('fallback','Use the lesson diagram and supplied reference values on paper. Record reasoning; leave unobserved tool performance unrated.')
 key=a['exitkey'] if a else t['key'];draw=a['draw'] if a else (sk['instruction'] if sk else 'Record the reference, expected and observed values with units. Add an endpoint or setup sketch on paper when it clarifies the reading; collect it as teacher observation evidence.')
 words=a['words'] if a else exitb.get('sei',{}).get('wordBank',[]);wrong,move=checks[ix];prior,connect=connections[ix]
 correct=next(o for o in qd['options'] if o['id']==qd['correctOptionId']);drawtarget=a['drawtarget'] if a else (sk.get('targetId') if sk else None)
 flow=[]
 def row(time,title,teacher,student,look):flow.append([p(time),phead(title)+label('Teacher:',teacher)+label('Students produce:',student)+label('Look/listen for:',look)])
 row('0–10 min' if minutes==110 else '0–7 min','Diagnostic opening',f'Open the lesson in Present and show its first diagram. Ask: “{qd["prompt"]}” Collect an individual choice and reason before discussion. Reveal: {correct["text"]}.', 'A saved opening response; then 60 seconds of partner explanation using the diagram.',wrong+'. '+move)
 model=' '.join([work.get('given',''),work.get('work',''),work.get('answer','')]) if work else (a['concept'] if a else t['key'])
 row('10–25 min' if minutes==110 else '7–17 min','Explain and model', ('State the relationship: '+a['concept']+' ' if a else '')+'Model aloud: '+model+' Ask a student to identify the reference, the unit and the evidence supporting the conclusion.', 'An annotated calculation or reference sketch with quantities and units; a prediction before the investigation.', 'A reason for each operation. If students repeat the answer without a method, cover the result and have them point to the given quantities.')
 row('25–45 min' if minutes==110 else '17–30 min','Investigation and individual record','Set up: '+material+' Direct the sequence: '+' '.join(f'{i+1}. {s}' for i,s in enumerate(steps))+' Rotate measurement/checking roles; observe each student rather than inferring skill from a group result.', 'An individual table with quantities, values, units and evidence source. Label supplied data as supplied; keep unexpected results.', move)
 if minutes==110:
  row('45–50 min','Stop and check the evidence','Pause work, reset tools and compare one example from two students. Ask what was held fixed and whether the recorded values support the claim. Re-model the specific error if needed.', 'A marked correction or a named check to perform next; a brief transition before the second investigation.', 'The original result remains visible; a correction includes a reason.')
  row('50–70 min','Test an explanation','Use this follow-up: '+move+' Students name one plausible explanation, predict a result and change one relevant factor or compare an independent method. With paper data, test an alternate interpretation of the same stated constraints; do not invent observations.', 'A second evidence record and an explanation of what the comparison supports or leaves unresolved.',wrong+' must be addressed with evidence, not replaced by a new unsupported claim.')
 row('70–90 min' if minutes==110 else '30–40 min','Drawing and handoff','Assign: '+draw+' Partners exchange without an oral explanation first. The reader identifies the datum/endpoints, units and one missing or ambiguous label; the author revises.', 'An individual labelled drawing or setup record, with NTS or a verified scale and a visible revision.', 'The representation agrees with the measurements and can be interpreted without the author supplying missing information.')
 row('90–103 min' if minutes==110 else '40–50 min','Individual exit and evidence','Ask the exact lesson exit: “'+exitb['prompt']+'” Allow the existing frame and word bank; require the same reasoning from every student. Collect before discussing the key.', 'An individual saved exit response or named paper response. Keep observations of actual tool use distinct from supplied-data reasoning.', 'Expected response: '+key)
 row('103–110 min' if minutes==110 else '50–55 min','Feedback, revision and next lesson','Return one specific next step. Use the target criteria below; do not turn self-ratings or a correct opening choice into a mastery grade. If the lesson has a self-assessment, complete it after the individual exit. Collect tools and preserve original evidence.', 'A next-check statement and any self-assessment already present in the lesson; teacher notes identify who needs a short recheck.', 'A missing response remains not observed, not an invented low score. Begin the next meeting by checking the misconception named below.')
 targetbody=label(target.get('targetId','Primary target')+'.',target['statement'])
 if drawtarget and drawtarget!=target.get('targetId'):targetbody+=label('Drawing / representation evidence:',drawtarget+' — '+draw)
 targetbody+=label('Success today:',key)
 body=box(f'DAY {n} · SESSION {code} · CYCLE {(n-1)//5+1}',phead(l['title'].split(' · ',1)[-1])+p(f'{minutes}-minute '+('long session · B+C double block' if minutes==110 else 'short session · one block')))
 body+=box("TODAY'S LEARNING TARGETS",targetbody)
 body+=box('THE FIELDHOUSE THREAD TODAY',label('What students know as today opens:',prior)+label('How today connects:',connect))
 body+=phead('Lesson Flow')+p(f'Use the {minutes}-minute sequence below. Timings include discussion, transitions and collection.')+table(['Time','What happens'],flow)
 if minutes==110:body+=box('IF THE SCHEDULE IS SHORTENED',p('Protect the individual exit. In a 55-minute version: 0–7 opening; 7–17 model; 17–30 one investigation; 30–40 drawing; 40–50 exit; 50–55 feedback. Schedule the independent follow-up check next time; do not mark practical performance complete from the abbreviated or supplied-data route.'))
 else:body+=box('IF A DOUBLE BLOCK IS AVAILABLE',p('Use 0–10 opening, 10–25 model, 25–45 investigation, 45–50 evidence check, 50–70 follow-up, 70–90 drawing, 90–103 exit and 103–110 feedback. The follow-up is: '+move+' Retain the exact individual exit and target criteria.'))
 form=label('Opening answer:',correct['text'])+label('Specific misconception:',wrong)+label('Teacher response:',move)+label('Exit prompt:',exitb['prompt'])+label('Expected evidence / answer:',key)
 for other in questions[1:]:
  oq=other['question'];ans=next(o['text'] for o in oq['options'] if o['id']==oq['correctOptionId']);form+=label('Additional checkpoint:',oq['prompt'])+label('Answer:',ans)
 if a:
  form+=label('3 — independent evidence:',key+' The student explains the method, quantities/units and an appropriate verification or limit without a substantive reasoning cue.')+label('2 — developing evidence:','A usable approach is present but one consequential quantity, comparison or explanation is missing, or the student completes it after a reasoning cue. Feedback: '+move)+label('1 — needs instruction:',wrong+'. The available response does not yet support the target; re-model the comparison and collect new individual evidence.')
 else:form+=label('Teacher 1–2–3 criteria:',t['rating'])
 form+=p('Rate only the named target from the actual individual evidence. Assess the physics rather than grammar, spelling or use of a scaffold. No evidence / not observed is distinct from an incorrect demonstration. Student self-ratings remain separate.')
 body+=box('FORMATIVE CHECKS (how teacher knows what students are getting)',form)
 pages=(f'Unit 1 continuation student materials, pages {2*(n-6)+2}–{2*(n-6)+3}' if u==1 and n>5 else f'Unit 2 student materials, pages {2*n}–{2*n+1}' if u==2 else 'Opening-Cycle Student Packet, the session '+code+' activity; Session 1.1 uses pages 1–2')
 body+=box('MATERIALS & READING',label('Prepare before class:',material)+label('In the application:',l['title']+' ('+l['slug']+'). Open the same lesson in Present; use its diagram, supplied data, procedure and response prompts.')+label('Print / reference:',pages+'. The lesson itself contains the prompts and supplied values if the local packet is unavailable.')+label('Drawing Book assignment:',a.get('drawing_book') or 'No additional Drawing Book reading required today.' if a else 'Use the lesson diagram and any assigned drawing prompt; no additional textbook reading required.')+label('If materials or access are unavailable:',fallback))
 body+=box('TEACHER NOTES',label('Before students arrive:','Check zero/reference and the physical setup; prepare one model record, keep the answer key teacher-only, and test the intended class access. Use classroom models or supplied data unless an actual fieldhouse survey has been verified.')+label('Language and access:', 'Keep the diagram visible. Offer 60 seconds of partner rehearsal, the lesson frame and these words: '+', '.join(words)+'. Accept the supported response modes with unchanged criteria.')+label('Recording in the application:', 'Collect responses in the existing lesson, then use teacher review and the existing 1–2–3 target ratings. Observe actual tool handling separately. Preserve the earlier version when a student revises.')+label('Next teaching decision:',move+' Recheck the same idea with a different example before treating it as independently secure.'))
 if n==15:
  c=cases[unit];body+=box('UNIT ASSESSMENT — CASE BRIEF',p(c['name'])+p(c['brief']))+table(c['headers'],[[p(v) for v in row] for row in c['rows']])+box('REQUIRED INDIVIDUAL SUBMISSION',checklist(c['deliverables']))
  body+=box('ASSESSMENT KEY AND FEEDBACK',label('Worked case key:',c['key'])+label('Strong response example:',c['exemplar'])+label('Partial response and feedback:',c['partial'])+label('Revision with new evidence:',c['new_evidence']))
  for dim,rub in c['rubric'].items():body+=phead(dim.upper()+' — 0–4 CASE RUBRIC')+table(['Level','Evidence descriptor'],[[p(k),p(v)] for k,v in rub['levels'].items()])
  body+=box('ASSESSMENT RECORDING',p('Record science, reasoning, communication and transfer separately using the current case recording sheet or the available case-review controls. These 0–4 dimensions do not replace the 1–2–3 target ratings and are not automatically averaged into a letter grade. Keep original and revised work together.'))
 result[u].append({'day':n,'title':l['title'],'bodyHtml':body})
for u,rows in result.items():
 rows.sort(key=lambda x:x['day']);assert [r['day'] for r in rows]==list(range(1,16));(OUT/f'trades-unit{u}-lesson-plans.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 print('Unit',u,len(rows),'explicit plans;',sum(len(re.sub('<[^>]+>',' ',r['bodyHtml']).split()) for r in rows),'words')
