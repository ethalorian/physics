"""Job-sized, assignable vocabulary tied to the new project lessons."""
import json, runpy
from pathlib import Path
HERE=Path(__file__).resolve().parent
old=runpy.run_path(str(HERE.parent/'trades-reset/vocabulary.py'))
glossary=old['GLOSSARY'].copy()
examples={}
for words in old['JOB_WORDS']:
 for term,example in words: examples.setdefault(term,example)
examples['repair']='After securing the loose actuator mount, repeat the same three-cycle test to check the repair.'
NEW={
 'hydraulic':('Using a liquid to transmit pressure and motion in a connected system.','A water-filled syringe pair can move a small platform from a remote hand input.'),
 'pneumatic':('Using a gas, commonly air, to transmit pressure and produce motion.','The air-filled syringe system feels springier because its air can compress.'),
 'piston':('A moving part that fits inside a cylinder and pushes on or is pushed by the fluid.','The syringe plunger moves its piston 20 mm during a measured input stroke.'),
 'input':('The action, energy, or signal supplied to a system.','Pushing the hand syringe is the input that moves the remote platform.'),
 'output':('The action, energy, or signal a system delivers.','The rising platform is the output of the connected syringe machine.'),
 'schematic':('A drawing that uses symbols to show functional connections rather than exact physical positions.','The lamp can move across the model room while its electrical connections on the schematic stay the same.'),
 'polarity':('The positive and negative orientation of electrical terminals or components.','Connect the protected LED using the polarity markings required by its classroom kit.'),
 'assembly drawing':('A drawing showing how components fit together to form a working object.','The assembly drawing shows the actuator mounted below the moving platform.'),
 'center spacing':('The distance between the center points or centerlines of two features.','Two mounting points 3/4 in from opposite edges of an 8 1/2-in plate have 7-in center spacing.'),
}
for term,(definition,example) in NEW.items():
 glossary[term]=dict(term=term,definition=definition,tier=3,category='project-language');examples[term]=example
WORD_ROWS=[
 'dimension|datum|fraction|blank|NTS|layout|prototype|revision',
 'user need|clearance|partition|inside dimension|outside dimension|thickness|prototype|acceptance criterion',
 'cut list|plan view|elevation view|stock|area|offcut|datum|verify',
 'revision|unit price|quantity|total cost|rework|fit|thickness|reasonableness check',
 'tolerance|acceptable range|inspection|handover|signed difference|traceability|dimension|fit',
 'template|center spacing|datum|offset|overall dimension|fraction|verify|rework',
 'load|footprint|elevation view|capacity|baseline|percent increase|trial|revision',
 'span|beam|cross section|deflection|stiffness|support|controlled variable|compression',
 'survey|datum|offset|opening|plan view|unit conversion|circulation|user need',
 'scale|scale factor|plan view|elevation view|coordination|actual dimension|layout|revision',
 'brace|diagonal|Pythagorean theorem|racking|triangulation|joint|load path|square (layout)',
 'takeoff|gross area|net area|allowance|opening|cut list|offcut|enclosure',
 'insulation|controlled variable|heat transfer|baseline|percent reduction|thermal envelope|trial|uncertainty',
 'revision|retest|deflection|percent reduction|thermal path|inspection|access|evidence',
 'inspection|scale|offset|acceptance criterion|limitation|handover|plan view|measured value',
 'discrepancy|datum|coordination|elevation view|revision|scale|offset|verify',
 'hydraulic|pneumatic|piston|input|output|displacement|measured value|uncertainty',
 'piston|ratio|area|displacement|alignment|brace|assembly drawing|output',
 'flow rate|volume|elapsed time|route|controlled variable|average rate|baseline|trial',
 'assembly drawing|centerline|center spacing|offset|bill of materials|clearance|fabrication|coordination',
 'fault|diagnosis|repair|volume|uncertainty|access|alignment|retest',
 'baseline|elapsed time|trial|mean|measured value|controlled variable|endpoint|evidence',
 'revision|percent increase|percent reduction|baseline|rate|retest|controlled variable|limitation',
 'assembly drawing|input|output|acceptance criterion|mean|handover|evidence|limitation',
 'diagnosis|unit conversion|displacement|reference line|repair|retest|hydraulic|pneumatic',
 'circuit|switch|closed circuit|open circuit|polarity|route|allowance|schematic',
 'schematic|layout|trial|fault|revision|switch|enclosure|access',
 'voltage|test point|rating|measured value|open circuit|diagnosis|schematic|uncertainty',
 "current|series circuit|Ohm's law|resistance|voltage|unit conversion|rating|test point",
 'parallel circuit|branch|switch|schematic|layout|route|allowance|inspection',
 'power|current|voltage|rating|access|enclosure|revision|test plan',
 'power|energy|watt|watt-hour|kilowatt-hour|operating time|tariff|assumption',
 'fault|diagnosis|hypothesis|repair|retest|schematic|handover|evidence',
 'template|datum|center spacing|dimension string|schematic|layout|inspection|unit conversion',
 'prototype|revision|baseline|percent reduction|user need|evidence|handover|inspection',
 'tolerance|acceptable range|inspection|limitation|handover|traceability|revision|reasonableness check',
]
# Reuse existing precise vocabulary where the colloquial authoring label differs.
ALIASES={'alignment':'coordination','rate':'average rate'}
days=json.loads((HERE/'days.json').read_text())
assert len(days)==len(WORD_ROWS)==36
sets=[]
for d,row in zip(days,WORD_ROWS):
 words=[ALIASES.get(t,t) for t in row.split('|')]
 assert len(set(words))==8
 terms=[]
 for i,term in enumerate(words):
  assert term in glossary and term in examples, term
  terms.append(dict(glossary[term],example=examples[term],order_index=i,difficulty='easy' if d['project']==1 else 'medium'))
 sets.append(dict(lesson_id=d['lesson_id'],lesson_slug=d['slug'],name=f'ETF P{d["project"]} · {d["meeting"]:02d} · {d["title"]}',unit_id=f'trades-etf-{d["project"]}',description='Eight words for this project meeting. Preview three or four at the bench; assign the full set or a selection for review. Practical skills are assessed separately.',recommended_target_slug=f'etf26.p{d["project"]}.vocabulary',terms=terms))
(HERE/'vocabulary-sets.json').write_text(json.dumps(sets,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(sets)} assignable sets, {sum(len(s["terms"]) for s in sets)} word entries; no assignments created.')
