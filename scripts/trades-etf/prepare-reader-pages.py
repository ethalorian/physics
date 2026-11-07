"""Prepare authenticated reader pages from the classroom edition of Engineering the Future.

Run with the course PDF folder (chapter_N.pdf or chapter_N-2.pdf) and, optionally,
a second PDF folder for missing chapters. Requires pdfminer.six, Pillow and pdftoppm.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path

from pdfminer.high_level import extract_pages
from pdfminer.layout import LAParams, LTChar, LTFigure, LTImage, LTTextBoxHorizontal, LTTextLineHorizontal
from pypdf import PdfReader
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / 'src/data/etf-original/chapters.json'
OUTPUT = ROOT / 'resources/etf-readers'


def clean(text):
    for ligature in ('ﬁ', 'ﬂ', 'ﬀ', 'ﬃ', 'ﬄ'):
        text = text.replace(ligature + ' ', ligature)
    return ' '.join(unicodedata.normalize('NFKC', text).replace('\u00ad', '').split())


def lines_for(page):
    lines = []
    for box in page:
        if not isinstance(box, LTTextBoxHorizontal):
            continue
        for line in box:
            if not isinstance(line, LTTextLineHorizontal):
                continue
            chars = [c for c in line if isinstance(c, LTChar) and c.upright and c.get_text().strip()]
            if not chars or line.y0 < 63 or line.y1 > page.height - 59:
                continue
            size, font = Counter((round(c.size,1), c.fontname.split('+')[-1]) for c in chars).most_common(1)[0][0]
            text = clean(line.get_text())
            if not text or size < 7 or re.match(r'^Copyright\s*©', text):
                continue
            if 'Times' in font and 10 <= size <= 13:
                kind = 'body'
            elif size >= 12 and ('Bold' in font or 'Trebuchet' in font) and size < 22:
                kind = 'heading'
            else:
                kind = 'extra'
            lines.append((kind, text, round(line.x0), round(page.height-line.y1), round(line.x1), size))
    return lines


def combine(lines, opening):
    blocks = []
    for role in ('main', 'extra'):
        seq = sorted((l for l in lines if (l[0]=='extra') == (role=='extra')), key=lambda l:(l[3],l[2]))
        last = None
        for kind,text,x,y,right,size in seq:
            # Keep diagram labels in the printed original. Captions, definitions and
            # extended prompts also remain available as selectable text.
            if role == 'extra' and (size >= 16 or len(text)<2):
                continue
            limit = 28 if opening and kind=='body' else 19
            separated = (not last or last[0]!=kind or kind=='heading' or y-last[3] > limit or y-last[3]<5
                         or abs(x-last[2])>64 or (kind=='body' and x-last[2]>=9 and last[1][-1] in '.?!’”)')
                         or (role=='extra' and (abs(size-last[5])>0.6 or abs(x-last[2])>17)))
            if separated:
                blocks.append({'kind':kind,'text':text})
            else:
                tail=blocks[-1]['text']
                blocks[-1]['text']=tail+('' if tail.endswith('-') else ' ')+text
            last=(kind,text,x,y,right,size)
    return blocks


def image_bounds(page, box):
    # Use the PDF crop box, the same coordinate system as the printed facsimile.
    left,bottom,right,top=map(float,box)
    width,height=right-left,top-bottom
    found=[]
    def visit(items):
        for item in items:
            if isinstance(item,LTFigure):
                visit(item)
            if not isinstance(item,LTImage):
                continue
            x0,y0,x1,y1=item.bbox
            w,h=x1-x0,y1-y0
            if w<70 or h<68 or w*h/(width*height)>.56 or not .32<w/h<4:
                continue
            if x0<left or y0<bottom or x1>right or y1>top: continue
            found.append((w*h,[round(v,2) for v in (100*(x0-left)/width,100*(top-y1)/height,100*w/width,100*h/height)]))
    visit(page)
    return max(found,key=lambda f:f[0])[1] if found else None


def prepare(chapter, folders, reuse_images):
    n=chapter['number']
    pdf=next((p for d in folders for name in (f'chapter_{n}.pdf',f'chapter_{n}-2.pdf') if (p:=d/name).is_file()),None)
    if pdf is None:
        raise FileNotFoundError(f'Chapter {n}')
    folder=OUTPUT / str(n)
    folder.mkdir(parents=True,exist_ok=True)
    start=chapter['from']
    layouts=list(extract_pages(pdf,laparams=LAParams(boxes_flow=None,line_margin=.35)))
    if start+len(layouts)-1 != chapter['to']:
        raise ValueError(f'Check printed pagination for chapter {n}')
    source=PdfReader(pdf)
    result=[]
    with tempfile.TemporaryDirectory() as temp:
        if not reuse_images:
            subprocess.run(['pdftoppm','-cropbox','-scale-to','1650','-jpeg','-jpegopt','quality=88',str(pdf),temp+'/p'],check=True,capture_output=True)
        images=sorted(Path(temp).glob('p-*.jpg'),key=lambda p:int(p.stem.split('-')[-1]))
        assert reuse_images or len(layouts)==len(images)
        for i,page in enumerate(layouts):
            target=folder/f'{start+i}.webp'
            if not reuse_images:
                with Image.open(images[i]) as image:
                    image.convert('RGB').save(target,format='WEBP',quality=83,method=4)
            assert target.is_file()
            blocks=combine(lines_for(page),i==0)
            figure=image_bounds(page,source.pages[i].cropbox)
            result.append({'printed':start+i,'blocks':blocks,**({'figure':figure} if figure else {})})
    data={'chapter':n,'first':start,'last':chapter['to'],'sourceSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pages':result}
    (folder/'chapter.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    print(f'{n:02}  {len(layouts)} pages',flush=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',nargs='+',type=Path)
    parser.add_argument('--chapters',nargs='+',type=int)
    parser.add_argument('--reuse-images',action='store_true',help='Only rebuild the text index from the same source PDFs')
    args=parser.parse_args()
    for c in json.loads(CATALOG.read_text()):
        if not args.chapters or c['number'] in args.chapters:
            prepare(c,args.source,args.reuse_images)
