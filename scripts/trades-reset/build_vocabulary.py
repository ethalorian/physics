"""Validate and build job word sets. Generates data only; never assigns students.

publish-vocabulary.sql is an initial-install transaction. It stops if any job
already has vocabulary, so rerunning cannot overwrite a teacher's edits or IDs.
Later revisions must use the canonical editor with a freshly read version.
"""
import json
import re
from pathlib import Path
from vocabulary import GLOSSARY, JOB_WORDS

HERE = Path(__file__).resolve().parent
COURSE = '33c5a178-998f-4158-aea9-f8589ade37b0'
jobs = json.loads((HERE / 'jobs.json').read_text())
lessons = {x['slug']: x for x in json.loads((HERE / 'lessons.json').read_text())}
assert len(jobs) == len(JOB_WORDS) == 36

PHASES = [
    ('Measure and make', 'I can define and recognize measurement, fit, drawing, and material-estimating vocabulary.'),
    ('Lay out and estimate', 'I can define and recognize layout, scale, cutting, estimating, and inspection vocabulary.'),
    ('Support and strengthen', 'I can define and recognize structural-load, support, deformation, and fair-test vocabulary.'),
    ('Route and move', 'I can define and recognize level, elevation, slope, clearance, and flow-rate vocabulary.'),
    ('Heat and electrical systems', 'I can define and distinguish thermal, circuit, power, energy, and system-planning vocabulary.'),
    ('Plan a school improvement', 'I can define and recognize proposal, survey, design, estimate, inspection, and handover vocabulary.'),
]

targets = [dict(slug=f'tr26.p{i}.vocabulary', statement=statement,
    domain='knowledge', program='trades', unit_id=f'trades-reset-{i}',
    content_strand='job-language', order_index=5, exclude_from_growth=False)
    for i, (_, statement) in enumerate(PHASES, 1)]

sets = []
for n, (j, entries) in enumerate(zip(jobs, JOB_WORDS), 1):
    slug = f'mvp-job-{n:02d}'
    l = lessons[slug]
    assert len({term.casefold() for term, _ in entries}) == 8
    terms = []
    for order, (term, example) in enumerate(entries):
        word = GLOSSARY[term]
        assert len(word['definition']) >= 20 and len(example) >= 30, (n, term)
        assert '|' not in example
        terms.append(dict(word, example=example, order_index=order,
            difficulty='easy' if n <= 6 else 'medium'))
    assert any(re.search(r'\d', w['example']) for w in terms), f'Job {n} needs a numerical application'
    sets.append(dict(lesson_id=l['id'], lesson_slug=slug, job_number=n,
        name=f'MVP Job {n:02d} · {j["title"]}', unit_id=l['unit_id'],
        recommended_target_slug=f'tr26.p{j["unit"]}.vocabulary',
        description=f'Eight job words for {j["title"].lower()}. '
        'Practice the meanings, then point to, sketch, calculate, or explain an example in your project. '
        f'Knowledge target: Phase {j["unit"]} job vocabulary. Practical skills are assessed in the job itself.',
        terms=terms))

assert sum(len(s['terms']) for s in sets) == 288
for filename, value in [('vocabulary-sets.json',sets), ('vocabulary-targets.json',targets)]:
    (HERE / filename).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

data = json.dumps(dict(sets=sets,targets=targets),ensure_ascii=False)
assert '$job_vocabulary$' not in data
sql = """begin;
do $install$
declare payload jsonb := $job_vocabulary$PAYLOAD$job_vocabulary$::jsonb;
 item jsonb; saved jsonb;
begin
 if exists(select 1 from public.vocabulary_sets s
   join public.lessons l on l.id::text=s.lesson_id where l.slug ~ '^mvp-job-[0-9]{2}$') then
   raise exception 'Job vocabulary already exists. Review fresh versions before editing; initial installer will not overwrite it.';
 end if;
 if (select count(*) from public.lessons l join jsonb_array_elements(payload->'sets') j
   on l.id=(j->>'lesson_id')::uuid and l.slug=j->>'lesson_slug'
   and l.unit_id=j->>'unit_id' where l.published) <> 36 then
   raise exception 'Expected 36 matching published job lessons';
 end if;
 if exists(select 1 from public.learning_targets t join jsonb_array_elements(payload->'targets') j on t.slug=j->>'slug') then
   raise exception 'Vocabulary targets already exist; review before editing';
 end if;
 insert into public.learning_targets(slug,statement,domain,program,unit_id,content_strand,order_index,exclude_from_growth)
 select slug,statement,domain,program,unit_id,content_strand,order_index,exclude_from_growth
 from jsonb_populate_recordset(null::public.learning_targets,payload->'targets');
 for item in select value from jsonb_array_elements(payload->'sets') loop
   saved := public.save_lesson_vocabulary((item->>'lesson_id')::uuid,null,item->'terms',true);
   update public.vocabulary_sets set name=item->>'name',description=item->>'description',
     created_by='antoccic@fitchburg.k12.ma.us'
   where id=(saved->>'setId')::uuid;
 end loop;
end $install$;
select jsonb_build_object(
 'sets',(select count(*) from public.vocabulary_sets s join public.lessons l on l.id::text=s.lesson_id where l.slug ~ '^mvp-job-[0-9]{2}$' and s.published and not s.archived),
 'terms',(select count(*) from public.vocabulary_terms t join public.vocabulary_sets s on s.id=t.vocabulary_set_id join public.lessons l on l.id::text=s.lesson_id where l.slug ~ '^mvp-job-[0-9]{2}$' and not t.archived),
 'knowledge_targets',(select count(*) from public.learning_targets where slug ~ '^tr26.p[1-6].vocabulary$' and domain='knowledge' and not exclude_from_growth)
);
commit;
""".replace('PAYLOAD',data)
(HERE / 'publish-vocabulary.sql').write_text(sql)

lines = ['# MVP Engineering · Job vocabulary', '',
    '36 published word sets · eight words per job · 288 job-word entries.', '',
    'Each set matches its job lesson and phase. Repeated words use a consistent definition and a new project example. '
    'Vocabulary supports the practical work; recognizing a definition does not establish measurement or fabrication competence.', '',
    '## Assign a job', '',
    f'1. Open [Assign vocabulary](https://www.antocciphysics.com/admin/vocabulary/assign?class={COURSE}).',
    '2. Select the matching **MVP Job NN** word set.',
    '3. Select the **trades-reset-N** Knowledge target whose statement is shown for that phase below.',
    '4. Choose practice or quiz, students, due date, and requirements, then press **Assign vocabulary** or **Assign quiz**.', '',
    'The six phase targets intentionally have no bulk default-word list: selecting a target preserves the eight words you chose for a job. '
    'The teacher can rate successive job assignments against the same phase Knowledge target. '
    'The installer creates no assignments or grades.', '',
    '## Use during the job', '',
    '- Before work: preview three or four unfamiliar words; show the real object or sketch.',
    '- During work: students label the words on their drawing or use them while explaining a calculation.',
    '- At handover: each student uses two words to explain a measurement, decision, or test result.',
    '- Assign all eight for a short review, or uncheck words to give a smaller starting set.', '',
    'Recognition practice is a reasonable starting setting; spelling is a separate demand. '
    'Keep the main lesson focused on measuring, making, checking, and explaining.', '']
current = None
for s in sets:
    phase = int(s['unit_id'].rsplit('-',1)[1])
    if phase != current:
        lines += [f'## Phase {phase} · {PHASES[phase-1][0]}', '',
            f'Knowledge target: **{PHASES[phase-1][1]}**', '']
        current = phase
    lines += [f'### {s["name"]}', '', '| Word | Meaning | In this job |', '|---|---|---|']
    lines += [f'| {t["term"]} | {t["definition"]} | {t["example"]} |' for t in s['terms']]
    lines += ['']
lines += ['## Technical references', '',
    'Definitions and examples are authored for these classroom jobs. Units were checked against '
    '[NIST SI unit tables](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-4-two-classes-si-units-and-si-prefixes) '
    'and heat-transfer language against [DOE Building Science Education](https://bsesc.energy.gov/training-modules/heat-transfer). '
    'Prices and numeric model cases are classroom data, not purchase quotes or installation specifications.', '']
(HERE / 'Vocabulary-Guide.md').write_text('\n'.join(lines))
print(json.dumps(dict(sets=len(sets),entries=sum(len(s['terms']) for s in sets),
    distinct_terms=len({t['term'] for s in sets for t in s['terms']}),knowledge_targets=len(targets))))
