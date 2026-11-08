"""Build Unit 1 print packets using the catalog's reviewed notes and new reading backs.

Usage: python package-referenced-readings.py <22 CPA reading pages.pdf> <22 Honors reading pages.pdf>
"""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
CATALOG = ROOT / 'src/data/student-choice-binder.json'
DAYS = range(1, 23)


def pdf_bytes(pages, title, unit=False):
    writer = PdfWriter()
    for page in pages:
        writer.add_page(page)
    if unit:
        for day in DAYS:
            front = 2 * (day-1)
            bookmark = writer.add_outline_item(f'Day {day}', front)
            writer.add_outline_item('Notes', front, parent=bookmark)
            writer.add_outline_item('Reading', front+1, parent=bookmark)
    writer.add_metadata({'/Title': title, '/Author': 'Craig Antocci'})
    writer.root_object[NameObject('/ViewerPreferences')] = DictionaryObject({
        NameObject('/PrintScaling'): NameObject('/None'),
        NameObject('/Duplex'): NameObject('/DuplexFlipLongEdge'),
    })
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def package(course, back_path, catalog, files):
    fronts = {}
    for packet in catalog:
        if packet['unit'] == 'unit-1' and course in packet.get('printPackets', {}):
            asset = packet['notes'][course]
            day = packet['day']
            assert fronts.setdefault(day, asset['path']) == asset['path'], (course, day)
            assert hashlib.sha256((PUBLIC / asset['path'].lstrip('/')).read_bytes()).hexdigest() == asset['sha256']
    assert set(fronts) == set(DAYS)
    backs = PdfReader(back_path)
    assert len(backs.pages) == len(DAYS)
    pages = []
    for day in DAYS:
        notes = PdfReader(PUBLIC / fronts[day].lstrip('/'))
        assert len(notes.pages) == 1
        front, back = notes.pages[0], backs.pages[day-1]
        for page in (front, back):
            assert tuple(page.mediabox) == (0, 0, 612, 792)
            header = page.extract_text().splitlines()[0]
            assert course.upper() in header and re.search(rf'\bDAY {day}\b', header), header
        refs = set(re.findall(r'\bSection\s+([A-E])\b', back.extract_text()))
        assert 'C' in refs and len(refs) >= 2, (course, day, refs)
        pages.extend([front, back])
        files[f'day-{day:02}-{course}-notes-and-reading.pdf'] = pdf_bytes(
            [front, back], f'Day {day} {course.upper()} notes and reading')
    files[f'unit-1-{course}-notes-and-readings.pdf'] = pdf_bytes(pages, f'Unit 1 {course.upper()} notes and readings', unit=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cpa_backs', type=Path)
    parser.add_argument('honors_backs', type=Path)
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text())
    files = {}
    for course, path in [('cpa', args.cpa_backs), ('honors', args.honors_backs)]:
        package(course, path, catalog, files)
    hashes = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
    digest = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()[:12]
    prefix = f'/student-choice-pages/unit-1/reading-references-{digest}'
    folder = PUBLIC / prefix.lstrip('/')
    folder.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        (folder / name).write_bytes(data)
    for packet in catalog:
        if packet['unit'] != 'unit-1':
            continue
        for course, bundle in packet.get('printPackets', {}).items():
            if course not in ('cpa', 'honors'):
                continue
            for role, name in [('day', f'day-{packet["day"]:02}-{course}-notes-and-reading.pdf'),
                               ('unit', f'unit-1-{course}-notes-and-readings.pdf')]:
                bundle[role].update(path=f'{prefix}/{name}', sha256=hashes[name])
    updated = CATALOG.with_suffix('.tmp')
    updated.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n')
    updated.replace(CATALOG)
    print(prefix)


if __name__ == '__main__':
    main()
