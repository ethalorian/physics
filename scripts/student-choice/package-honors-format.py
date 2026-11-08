"""Package 22 reviewed Honors fronts and reuse the approved narrative behind each.

Usage: python package-honors-format.py <aligned HTML directory> <22-front PDF>
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject

root = Path(__file__).resolve().parents[2]
public = root / 'public'
catalog_path = root / 'src/data/student-choice-binder.json'
catalog = json.loads(catalog_path.read_text())
base = public / 'student-choice-pages/unit-1/layout-1215defe2f22'
original = base / 'unit-1-honors-notes-and-readings.pdf'
source = Path(sys.argv[1])
fronts = PdfReader(sys.argv[2])
prior = PdfReader(original)
assert len(fronts.pages) == 22 and len(prior.pages) == 44
digest = hashlib.sha256(hashlib.sha256(original.read_bytes()).hexdigest().encode())
files = sorted(source.glob('*.html'))
assert len(files) == 23
for file in files:
    digest.update(file.read_bytes())
prefix = '/student-choice-pages/unit-1/honors-format-' + digest.hexdigest()[:12]
dest = public / prefix.lstrip('/')
dest.mkdir(parents=True, exist_ok=True)
for file in files:
    shutil.copyfile(file, dest / file.name)

def save(pages, filename, title, duplex, bookmarks=False):
    writer = PdfWriter()
    for page in pages:
        writer.add_page(page)
    if bookmarks:
        for day in range(1, 23):
            parent = writer.add_outline_item(f'Day {day}', 2 * day - 2)
            writer.add_outline_item('Notes', 2 * day - 2, parent=parent)
            writer.add_outline_item('Reading', 2 * day - 1, parent=parent)
    writer.add_metadata({'/Title': title, '/Author': 'Craig Antocci'})
    writer.root_object[NameObject('/ViewerPreferences')] = DictionaryObject({
        NameObject('/PrintScaling'): NameObject('/None'),
        NameObject('/Duplex'): NameObject('/DuplexFlipLongEdge' if duplex else '/Simplex'),
    })
    writer.write(dest / filename)
    return dict(path=f'{prefix}/{filename}', sha256=hashlib.sha256((dest / filename).read_bytes()).hexdigest())

notes, pairs, ordered = {}, {}, []
for day in range(1, 23):
    front, back = fronts.pages[day-1], prior.pages[day*2-1]
    for page in (front, back):
        assert tuple(page.mediabox) == (0, 0, 612, 792)
        assert f'DAY {day}' in page.extract_text().split('\n', 1)[0]
    ordered.extend([front, back])
    notes[day] = save([front], f'day-{day:02}-honors-notes.pdf', f'Honors notes · Day {day}', False)
    pairs[day] = save([front, back], f'day-{day:02}-honors-notes-and-reading.pdf', f'Honors notes and reading · Day {day}', True)
unit = save(ordered, original.name, 'Unit 1 Honors notes and readings', True, bookmarks=True)
for packet in catalog:
    if packet['unit'] != 'unit-1' or 'honors' not in packet['notes']:
        continue
    day = packet['day']
    packet['notes']['honors'].update(notes[day])
    bundle = packet.get('printPackets', {}).get('honors')
    if bundle:
        bundle['day'].update(pairs[day])
        bundle['unit'].update(unit)
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
print(unit['path'])
