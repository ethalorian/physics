#!/usr/bin/env python3
"""
Apply the textbook reading map (src/data/textbook-reading-map.json) to the repo's
curriculum sources:

  1. src/data/unitN-blocks/uN-dNN.json — replaces any `reading` blocks with the
     map's (two per day: visibilityTrack 'cpa' = light, 'honors' = full).
  2. src/data/unitN-cpa-lesson-plans.json — writes the "Hewitt reading:" line
     (CPA / Honors) into each day's MATERIALS & READING cell.

It also prints the SQL that syncs the live `lessons` rows (paste into the
Supabase SQL editor) so DB and repo never drift.

Usage:  python3 scripts/apply-reading-map.py [--sql-only]
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = json.load(open(os.path.join(ROOT, 'src/data/textbook-reading-map.json')))
blocks_by_slug = MAP['blocks']; plan_lines = MAP['plan_lines']
sql_only = '--sql-only' in sys.argv

# 1. day JSON files
changed = 0
if not sql_only:
    for slug, blocks in blocks_by_slug.items():
        unit = slug.split('-')[0][1:]
        path = os.path.join(ROOT, f'src/data/unit{unit}-blocks/{slug}.json')
        if not os.path.exists(path):
            print('  (no source file)', slug); continue
        doc = json.load(open(path))
        doc['blocks'] = [b for b in doc['blocks'] if b.get('type') != 'reading'] + blocks
        json.dump(doc, open(path, 'w'), indent=2, ensure_ascii=False); open(path, 'a').write('\n')
        changed += 1
    print('day files updated:', changed)

    # 2. teacher plan lines
    for unit in range(1, 8):
        path = os.path.join(ROOT, f'src/data/unit{unit}-cpa-lesson-plans.json')
        plans = json.load(open(path)); n = 0
        for day in plans:
            slug = f"u{unit}-d{day['day']:02d}"
            line = plan_lines.get(slug, '<strong>CPA:</strong> no reading. <strong>Honors:</strong> no reading.')
            html = day['bodyHtml']
            new_p = f'<p><strong>Hewitt reading:</strong> <em>{line}</em></p>'
            if 'Hewitt reading:' in html:
                html, k = re.subn(r'<p><strong>Hewitt reading:</strong>.*?</p>', new_p, html, count=1, flags=re.S)
            else:
                # end of the MATERIALS & READING cell if it exists, else end of body
                m = re.search(r'(MATERIALS &amp; READING.*?)(</td>)', html, flags=re.S)
                if m:
                    html = html[:m.end(1)] + '\n' + new_p + html[m.end(1):]
                else:
                    html = html + '\n' + new_p
            if html != day['bodyHtml']:
                day['bodyHtml'] = html; n += 1
        json.dump(plans, open(path, 'w'), indent=2, ensure_ascii=False); open(path, 'a').write('\n')
        print(f'unit {unit}: {n} plan days updated')

# 3. SQL for the live rows
vals = ",\n".join("('%s', '%s'::jsonb)" % (s, json.dumps(b, ensure_ascii=False).replace("'", "''")) for s, b in blocks_by_slug.items())
sql = f"""BEGIN;
UPDATE lessons l SET content_blocks = jsonb_set(l.content_blocks, '{{blocks}}', (SELECT COALESCE(jsonb_agg(b), '[]'::jsonb) FROM jsonb_array_elements(l.content_blocks->'blocks') b WHERE b->>'type' <> 'reading') || v.add), updated_at = now()
FROM (VALUES
{vals}
) AS v(slug, add) WHERE l.slug = v.slug;
COMMIT;"""
out = os.path.join(ROOT, 'src/data/apply-reading-map.sql')
open(out, 'w').write(sql + '\n'); print('SQL written to', os.path.relpath(out, ROOT))
