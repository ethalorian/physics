"""Package reviewed duplex PDFs and verbatim practice sheets into a new edition.

Usage: python package-readings.py <reviewed-cpa-pdf> <reviewed-honors-pdf>
Requires pypdf (available in the Codex document runtime).
"""
from pathlib import Path
import copy, hashlib, itertools, json, re, sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, DictionaryObject

ROOT = Path(__file__).resolve().parents[2]
catalog_path = ROOT / 'src/data/student-choice-binder.json'
catalog = json.loads(catalog_path.read_text())
inputs = dict(zip(['cpa', 'honors'], map(Path, sys.argv[1:])))
assert len(inputs) == 2
digest = hashlib.sha256(b''.join(p.read_bytes() for p in inputs.values())).hexdigest()[:12]
version = f'readings-{digest}'
prefix = f'/student-choice-pages/unit-1/{version}'
dest = ROOT / 'public' / prefix.lstrip('/')
dest.mkdir(parents=True, exist_ok=True)

def page_asset(file, title):
    return {'title': title, 'path': f'{prefix}/{file}', 'sha256': hashlib.sha256((dest / file).read_bytes()).hexdigest()}

def pdf_pages(reader, numbers, file, title, duplex=False):
    writer = PdfWriter()
    for number in numbers:
        writer.add_page(reader.pages[number])
    writer.add_metadata({'/Title': title, '/Author': 'Craig Antocci'})
    writer._root_object[NameObject('/ViewerPreferences')] = DictionaryObject({NameObject('/PrintScaling'): NameObject('/None'), NameObject('/Duplex'): NameObject('/DuplexFlipLongEdge' if duplex else '/Simplex')})
    with (dest / file).open('wb') as handle:
        writer.write(handle)
    return page_asset(file, title)

readers = {edition: PdfReader(path) for edition, path in inputs.items()}
assert all(len(r.pages) == 44 for r in readers.values())
units = {}
for edition, path in inputs.items():
    file = f'unit-1-{edition}-notes-and-readings.pdf'
    (dest / file).write_bytes(path.read_bytes())
    units[edition] = page_asset(file, f'All 22 {edition.upper()} notes and readings')

current = []
for packet in catalog:
    if packet['key'] not in {p['key'] for p in current}:
        current.append(packet)
assert len(current) == 22
new = []
for original in current:
    packet = copy.deepcopy(original)
    day = packet['day']; nn = f'{day:02}'
    packet['version'] = version
    packet['printPackets'] = {}
    packet['practicePrintBase'] = prefix
    for edition, reader in readers.items():
        pair = pdf_pages(reader, [2 * day - 2, 2 * day - 1], f'day-{nn}-{edition}-notes-and-reading.pdf', f'Day {day} {edition.upper()} notes and reading', True)
        notes = pdf_pages(reader, [2 * day - 2], f'day-{nn}-{edition}-notes.pdf', packet['notes'][edition]['title'])
        notes['target'] = packet['notes'][edition].get('target', packet['target'])
        packet['notes'][edition] = notes
        packet['printPackets'][edition] = {'day': pair, 'unit': units[edition]}
    sections = []
    for i, option in enumerate(packet['options'], 1):
        source = ROOT / 'public' / option['path'].lstrip('/')
        html = source.read_text()
        section = re.search(r'<section\b[\s\S]*?</section>', html).group()
        sections.append(section)
        if i == 1:
            head = html[:html.index('<section')]
            base = str(Path(option['path']).parent) + '/'
            head = head.replace('<head>', f'<head><base href="{base}">')
        preview_file = f'day-{nn}-option-{i}-preview.html'
        preview_head = head.replace('</head>', '<style>.binder-tools{display:none!important}doc-page{padding:0!important;background:white!important}.page{margin:0!important;border-radius:0!important;box-shadow:none!important}</style></head>')
        (dest / preview_file).write_text(preview_head + section + '</doc-page></body></html>')
        option['previewPath'] = f'{prefix}/{preview_file}'
    assert len(sections) == 6 and sum(bool(o.get('sei')) for o in packet['options']) == 2
    for choices in itertools.combinations(range(1, 7), 3):
        file = f'day-{nn}-practice-{"-".join(map(str, choices))}.html'
        combined = head + '\n'.join(sections[i - 1] for i in choices) + '</doc-page></body></html>'
        assert re.findall(r'<section\b[\s\S]*?</section>', combined) == [sections[i - 1] for i in choices]
        (dest / file).write_text(combined)
    (dest / f'day-{nn}-practice-all.html').write_text(head + '\n'.join(sections) + '</doc-page></body></html>')
    new.append(packet)

# Keep every prior edition available for pinned historical assignments.
catalog_path.write_text(json.dumps(new + [p for p in catalog if p['version'] != version], ensure_ascii=False, indent=2) + '\n')
manifest = {'version': version, 'sourcePdfs': {edition: {'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for edition, path in inputs.items()}, 'days': 22, 'practiceCombinations': 440, 'practiceSections': 'verbatim source sections', 'fontsAndIllustrations': 'original local assets', 'print': 'Letter, 100%; notes/readings duplex long edge; practice one-sided'}
(dest / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'version': version, 'files': len(list(dest.iterdir())), 'directory': str(dest)}, indent=2))
