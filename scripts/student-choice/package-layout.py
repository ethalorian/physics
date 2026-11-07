"""Package reviewed layout repairs without changing lessons or assignment identity.

Usage: python package-layout.py <repaired-html-dir> <44-note-fronts.pdf>
The native PDF export must contain CPA days 1–22, then Honors days 1–22.
Narrative backs are copied from the previously approved published edition.
"""
from pathlib import Path
import copy, hashlib, json, re, sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, DictionaryObject

ROOT = Path(__file__).resolve().parents[2]
source, front_path = map(Path, sys.argv[1:])
catalog_path = ROOT / 'src/data/student-choice-binder.json'
catalog = json.loads(catalog_path.read_text())
prior = ROOT / 'public/student-choice-pages/unit-1/readings-f35334d84aee'
fronts = PdfReader(front_path)
assert len(fronts.pages) == 44
backs = {e: PdfReader(prior / f'unit-1-{e}-notes-and-readings.pdf') for e in ['cpa', 'honors']}
digest = hashlib.sha256(front_path.read_bytes())
for p in sorted(source.glob('*.html')):
    digest.update(p.read_bytes())
for e in backs:
    digest.update((prior / f'unit-1-{e}-notes-and-readings.pdf').read_bytes())
version = 'layout-' + digest.hexdigest()[:12]
prefix = '/student-choice-pages/unit-1/' + version
dest = ROOT / 'public' / prefix.lstrip('/')
dest.mkdir(parents=True, exist_ok=True)

def asset(file):
    return {'path': f'{prefix}/{file}', 'sha256': hashlib.sha256((dest / file).read_bytes()).hexdigest()}

def pdf(pages, file, title, duplex=False):
    writer = PdfWriter()
    for page in pages:
        writer.add_page(page)
    writer.add_metadata({'/Title': title, '/Author': 'Craig Antocci'})
    writer._root_object[NameObject('/ViewerPreferences')] = DictionaryObject({NameObject('/PrintScaling'): NameObject('/None'), NameObject('/Duplex'): NameObject('/DuplexFlipLongEdge' if duplex else '/Simplex')})
    writer.write(dest / file)
    return asset(file)

units, notes, pairs = {}, {}, {}
for ei, edition in enumerate(['cpa', 'honors']):
    pages = []
    for day in range(1, 23):
        front, back = fronts.pages[ei * 22 + day - 1], backs[edition].pages[2 * day - 1]
        pages.extend([front, back])
        notes[edition, day] = pdf([front], f'day-{day:02}-{edition}-notes.pdf', f'Day {day} {edition.upper()} notes')
        pairs[edition, day] = pdf([front, back], f'day-{day:02}-{edition}-notes-and-reading.pdf', f'Day {day} {edition.upper()} notes and reading', True)
    name = f'unit-1-{edition}-notes-and-readings.pdf'
    units[edition] = pdf(pages, name, f'Unit 1 {edition.upper()} notes and readings', True)
    result = PdfReader(dest / name)
    for day in range(1, 23):
        assert result.pages[2 * day - 1].get_contents().get_data() == backs[edition].pages[2 * day - 1].get_contents().get_data(), 'Narrative changed'

options = {}
for day in range(1, 23):
    sections = []
    for option in range(1, 7):
        html = (source / f'practice-{day}-{option}.html').read_text()
        section = re.search(r'<section\b[\s\S]*?</section>', html)[0]
        head = html[:html.index('<section')]
        file = f'day-{day:02}-option-{option}.html'
        (dest / file).write_text(html)
        preview = file.replace('.html', '-preview.html')
        preview_head = head.replace('</head>', '<style>.binder-tools{display:none!important}doc-page{padding:0!important;background:white!important}.page{margin:0!important;border-radius:0!important;box-shadow:none!important}</style></head>')
        (dest / preview).write_text(preview_head + section + '</doc-page></body></html>')
        options[day, option] = {**asset(file), 'previewPath': f'{prefix}/{preview}'}
        sections.append(section)
    (dest / f'day-{day:02}-practice-all.html').write_text(head + '\n'.join(sections) + '</doc-page></body></html>')
    for edition in ['cpa', 'honors']:
        (dest / f'day-{day:02}-{edition}-notes.html').write_bytes((source / f'{edition}-{day}.html').read_bytes())
for edition in ['cpa', 'honors']:
    (dest / f'unit-1-{edition}-notebook.html').write_bytes((source / f'{edition}-all.html').read_bytes())

def repaired(packet):
    result = copy.deepcopy(packet)
    day = packet['day']
    for edition, note in result['notes'].items():
        note.update(notes[edition, day])
    for i, option in enumerate(result['options'], 1):
        option.update(options[day, i])
    if 'practicePrintBase' in result:
        result['practicePrintBase'] = prefix
    for edition, bundle in result.get('printPackets', {}).items():
        bundle['day'].update(pairs[edition, day])
        bundle['unit'].update(units[edition])
    return result

current = []
for packet in catalog:
    if packet['key'] not in {p['key'] for p in current}:
        current.append(packet)
assert len(current) == 22
new = [dict(repaired(p), version=version) for p in current]
historical = [repaired(p) for p in catalog if p['version'] != version]

def without_assets(value):
    if isinstance(value, list):
        return [without_assets(v) for v in value]
    if isinstance(value, dict):
        return {k: without_assets(v) for k, v in value.items() if k not in ['path', 'sha256', 'previewPath', 'practicePrintBase']}
    return value

assert without_assets(historical) == without_assets([p for p in catalog if p['version'] != version]), 'Historical identity or lesson metadata changed'
catalog_path.write_text(json.dumps(new + historical, ensure_ascii=False, indent=2) + '\n')
manifest = {'version': version, 'notes': 44, 'practice': 132, 'duplexPagesPerCourse': 44, 'narrativeBacks': 'unchanged approved PDF content streams', 'historicalAssignments': 'keys, versions, option order and metadata preserved; corrected presentation assets', 'sourceFrontsSha256': hashlib.sha256(front_path.read_bytes()).hexdigest(), 'print': 'Letter 100%; duplex long edge; 0.9in left notes/practice and right narratives', 'layoutRules': 'resources/student-choice/print-layout.css'}
(dest / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'version': version, 'files': len(list(dest.iterdir())), 'directory': str(dest)}, indent=2))
