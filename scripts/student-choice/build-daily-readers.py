"""Publish digital excerpts from the approved Unit 1 notes and narrative sources."""
import json
import logging
import re
import subprocess
import tempfile
from pathlib import Path

from lxml import html
from PIL import Image
import pdfplumber

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
DEST = PUBLIC / 'student-choice-pages/unit-1/interactive-v1'
SOURCES = ROOT / 'resources/student-choice'
LETTERS = 'ABCDE'
logging.getLogger('pdfminer').setLevel(logging.ERROR)


def plain(node):
    return ' '.join(' '.join(node.itertext()).split())


def save(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def note_sections(pdf, document):
    with pdfplumber.open(pdf) as doc:
        page = doc.pages[0]
        labels = sorted((r for r in page.rects if abs(r['width']-58.5)<0.05 and abs(r['height']-12.75)<0.05),key=lambda r:(round(r['top']),r['x0']))
        assert len(labels) == 5
        # The black tabs give the exact crop positions in the released print edition.
        start = labels[0]['x0'] - 6
        middle = labels[1]['x0'] - 4
        key = next(line for line in page.extract_text_lines() if 'UNIT 1 COLOR CODE' in line['text'])
        bottom = [labels[2]['top']-3, labels[2]['top']-3, labels[3]['top']-3, labels[4]['top']-3,key['top']-4]
        sections = {}
        for i,letter in enumerate(LETTERS):
            heading = document.xpath(f'//*[@data-section="{letter}"]')[0]
            block = heading.getparent()
            if letter in 'CE': block = block.getparent()
            left = middle if letter=='B' else start
            right = middle-2 if letter=='A' else 591
            top = labels[i]['top']-3
            assert bottom[i] > top + 14
            sections[letter] = {'title': plain(heading[1]), 'text':plain(block), 'box':[round(n,2) for n in [left,top,right-left,bottom[i]-top]]}
        return sections


def main():
    DEST.mkdir(parents=True,exist_ok=True)
    catalog = json.loads((ROOT/'src/data/student-choice-binder.json').read_text())
    days = sorted((p for p in catalog if p['version']=='layout-1215defe2f22'),key=lambda p:p['day'])
    assert [p['day'] for p in days] == list(range(1,23))
    names = json.loads((SOURCES/'daily-reader/term-names.json').read_text())
    index = []
    for course in ('cpa','honors'):
        readings = json.loads((SOURCES/f'unit-1-readings/{course}.json').read_text())
        for day,reading in zip(days,readings,strict=True):
            n = day['day']
            assert n==reading['day']
            stem=f'{course}-{n:02}'
            note=day['notes'][course]
            pdf=PUBLIC/note['path'].lstrip('/')
            document=html.fromstring(pdf.with_suffix('.html').read_text())
            sections=note_sections(pdf,document)
            cells=document.xpath('//*[@data-section="A"]')[0].getnext().getchildren()
            words=[{'term':names[course].get(plain(k),plain(k)),'definition':plain(v)} for k,v in zip(cells[::2],cells[1::2],strict=True)]
            assert len(words)==4
            d=document.xpath('//*[@data-section="D"]')[0].getparent()
            example=plain(d[1])
            work=plain(d[2])
            with tempfile.TemporaryDirectory() as temp:
                dest=Path(temp)/'front'
                subprocess.run(['pdftoppm','-singlefile','-r','150','-png',str(pdf),str(dest)],check=True)
                with Image.open(dest.with_suffix('.png')) as img:
                    img.convert('L').save(DEST/(stem+'.webp'),quality=90,method=5)
            for paragraph in reading['paragraphs']:
                assert not set(re.findall(r'<[^>]+>',paragraph)) - {f'<{end}{tag}>' for tag in ['b','eq','var','sub'] for end in ['', '/']}
            save(DEST/(stem+'.json'),{**reading,'edition':course,'sections':sections,'words':words,'packet':day['printPackets'][course]['day']['path']})
            index.append({'edition':course,'day':n,'title':reading['title'],'focus':reading['subtitle'],'figure':sections['C']['title'],'example':example,'solution':work,'words':words})
    save(SOURCES/'daily-reader/lessons.json',index)


if __name__ == '__main__':
    main()
