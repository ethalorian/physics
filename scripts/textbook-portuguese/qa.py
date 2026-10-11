"""Reopen Portuguese chapters and prepare visual contact sheets; no network calls."""
import argparse,hashlib,json,math
from pathlib import Path
import pymupdf as fitz
from PIL import Image,ImageDraw

parser=argparse.ArgumentParser()
parser.add_argument('work',type=Path)
parser.add_argument('output',type=Path)
parser.add_argument('--sheets',action='store_true')
parser.add_argument('--from-chapter',type=int,default=2)
parser.add_argument('--through',type=int,default=40)
args=parser.parse_args()
qa=args.output/'qa';qa.mkdir(exist_ok=True)
results=[];pictures=[]
for source_file in sorted(args.work.glob('*.source.json')):
    source=json.loads(source_file.read_text());chapter=source['chapter']
    if not args.from_chapter<=chapter<=args.through:continue
    pdf_file=args.output/f'cp{chapter:02}.pdf'
    if not pdf_file.exists():continue
    doc=fitz.open(pdf_file)
    assert len(doc)==len(source['pages']),(chapter,'page count')
    assert doc.xref_get_key(doc.pdf_catalog(),'Lang')==('string','pt-BR'),(chapter,'language metadata')
    selected={1,2,len(doc)}
    for p in source['pages']:
        es_file=args.work/f'cp{chapter:02}.p{p["page"]:03}.pt.json'
        if es_file.exists() and json.loads(es_file.read_text()).get('layoutOverrides'):selected.add(p['page'])
    for i,page in enumerate(doc):
        source_page=source['pages'][i]
        assert abs(page.rect.width-source_page['width'])<.02 and page.rect.height>=source_page['height']-.02,(chapter,i+1,'geometry')
        text=page.get_text()
        assert '[GLYPH_' not in text,(chapter,i+1,'unrendered placeholder')
        if source_page['blocks']:assert text.strip(),(chapter,i+1,'empty text layer')
        if args.sheets and i+1 in selected:
            dest=qa/f'cp{chapter:02}.p{i+1:03}.png'
            page.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(str(dest))
            pictures.append((chapter,i+1,dest))
    results.append({'chapter':chapter,'pages':len(doc),'visualPages':sorted(selected),'sha256':hashlib.sha256(pdf_file.read_bytes()).hexdigest()})
if args.sheets:
    # Small previews compare column geometry; individual PNGs remain available
    # at full size for checking equations and fine text.
    for start in range(0,len(pictures),6):
        group=pictures[start:start+6];sheet=Image.new('RGB',(1500,1800),'#e5e7eb');draw=ImageDraw.Draw(sheet)
        for offset,(chapter,page,file) in enumerate(group):
            picture=Image.open(file).convert('RGB');picture.thumbnail((480,845))
            x=(offset%3)*500+(500-picture.width)//2;y=(offset//3)*900+35
            sheet.paste(picture,(x,y));draw.text(((offset%3)*500+12,(offset//3)*900+10),f'Chapter {chapter} / PDF page {page}',fill='#111827')
        sheet.save(qa/f'sheet-{args.from_chapter:02}-{args.through:02}-{start//6+1:02}.jpg',quality=92)
(qa/f'pdf-integrity-{args.from_chapter:02}-{args.through:02}.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'chapters':len(results),'pages':sum(c['pages'] for c in results),'visualPages':sum(len(c['visualPages']) for c in results),'sheets':math.ceil(len(pictures)/6)},indent=2))
