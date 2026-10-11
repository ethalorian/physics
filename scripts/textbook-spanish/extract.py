"""Extract the provided student PDFs; keep source geometry and page identity."""
import argparse, collections, hashlib, json, re
from pathlib import Path
import pymupdf as fitz

def letters(n):
    return chr(65+n%26)+(letters(n//26-1) if n>=26 else '')

def math_span(s):
    return bool(re.search(r'MathematicalPi-(?:One|Three|Four)|PHSchoolGreek|Symbol',s['font']))

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('work', type=Path)
args = parser.parse_args()
args.work.mkdir(parents=True, exist_ok=True)
manifest = []
for filename in sorted(args.source.glob('cp[0-9][0-9].pdf')):
    chapter = int(filename.stem[2:])
    doc = fitz.open(filename)
    pages = []
    for page in doc:
        blocks = []
        initials = []
        originals=[]
        for original in page.get_text('dict')['blocks']:
            if original['type'] != 0:
                continue
            lines=original['lines']
            short_math=any(math_span(s) for l in lines for s in l['spans']) and sum(len(s['text']) for l in lines for s in l['spans'])<250
            if short_math:
                # Translate equation WORDS in place; leave fraction bars, variables,
                # operators, subscripts and superscripts in their exact geometry.
                for line in lines:
                    for span in line['spans']:
                        if not math_span(span): originals.append({'type':0,'bbox':span['bbox'],'lines':[{'spans':[span]}],'equation':True})
            else:
                prose=[]
                def flush_prose():
                    if not prose: return
                    bbox=fitz.Rect(prose[0]['bbox'])
                    for l in prose[1:]:bbox|=fitz.Rect(l['bbox'])
                    originals.append({'type':0,'bbox':list(bbox),'lines':list(prose)})
                    prose.clear()
                for line in lines:
                    line_text=''.join(s['text'] for s in line['spans'])
                    formula_line=len(line_text)<95 and any(math_span(s) for s in line['spans']) and len(re.findall(r'[A-Za-z]{2,}',line_text))<=3
                    if formula_line:
                        flush_prose()
                        for span in line['spans']:
                            if not math_span(span): originals.append({'type':0,'bbox':span['bbox'],'lines':[{'spans':[span]}],'equation':True})
                    else: prose.append(line)
                flush_prose()
        for original in originals:
            spans = [s for line in original['lines'] for s in line['spans']]
            glyphs={}
            lines=[]
            for line in original['lines']:
                pieces=[]
                for s in line['spans']:
                    special=(math_span(s) or any(ord(c)<32 for c in s['text']) or bool(s['flags'] & 1)) and s['text'].strip()
                    if special:
                        token='[GLYPH_'+letters(len(glyphs))+']'
                        glyphs[token]={'bbox':s['bbox'],'text':s['text'],'sup':bool(s['flags']&1)}
                        pieces.append(' '+token+' ')
                    else: pieces.append(s['text'])
                lines.append(''.join(pieces))
            text = re.sub(r'(\w)-\n(?=[a-z])', r'\1', '\n'.join(lines))
            text = re.sub(r'[\x00-\x08\x0b-\x1f]', '', text)
            text = re.sub(r'\s+', ' ', text).strip()
            # Printer marks are not book content. Pure formulas/numbers remain untouched.
            if re.fullmatch(r'[A-Z]', text) and max(s['size'] for s in spans) >= 24:
                initials.append({'text':text,'bbox':original['bbox']})
            if not text or '.indd' in text or not re.search(r'[A-Za-z]{2}', text):
                continue
            counts = collections.Counter()
            for span in spans:
                counts[(round(span['size'], 1), span['font'], span['color'])] += len(span['text'])
            size, font, color = counts.most_common(1)[0][0]
            blocks.append({'id':str(len(blocks)), 'text':text, 'bbox':original['bbox'],
                           'size':size, 'font':font, 'color':color, 'glyphs':glyphs,'equation':original.get('equation',False),
                           'lines':[[{'bbox':s['bbox'], 'text':s['text']} for s in l['spans']] for l in original['lines']]})
        for initial in initials:
            candidates = [b for b in blocks if abs(b['bbox'][1]-initial['bbox'][1]) < 55 and b['bbox'][0] <= initial['bbox'][2]+8 and len(b['text'])>100]
            if candidates:
                b=min(candidates,key=lambda b:abs(b['bbox'][1]-initial['bbox'][1]))
                b['text']=initial['text']+b['text']
                b.setdefault('extra_redactions',[]).append(initial['bbox'])
        merged=[]
        for b in blocks:
            prev=merged[-1] if merged else None
            if prev and not prev['equation'] and not b['equation'] and not re.search(r'[.!?:;]$',prev['text']) and not prev['text'].isupper() and 0<=b['bbox'][1]-prev['bbox'][3]<=6 and -1<=b['bbox'][0]-prev['bbox'][0]<=20 and abs(b['size']-prev['size'])<1:
                mapping={token:'[GLYPH_'+letters(len(prev['glyphs'])+i)+']' for i,token in enumerate(b['glyphs'])}
                b['text']=re.sub(r'\[GLYPH_[A-Z]+\]',lambda m:mapping[m.group()],b['text'])
                prev['glyphs'].update({mapping[token]:glyph for token,glyph in b['glyphs'].items()})
                if prev['text'].endswith('-') and re.match(r'[a-z]',b['text']):prev['text']=prev['text'][:-1]+b['text']
                else:prev['text']+=' '+b['text']
                prev['bbox']=[min(prev['bbox'][0],b['bbox'][0]),prev['bbox'][1],max(prev['bbox'][2],b['bbox'][2]),b['bbox'][3]]
                prev['lines']+=b['lines']
            else:
                merged.append(b)
        for i,b in enumerate(merged): b['id']=str(i)
        for b in merged:
            for token,g in b['glyphs'].items():
                name=f'cp{chapter:02}.p{page.number+1:03}.b{b["id"]}.{token[1:-1]}.png'
                page.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(g['bbox']),alpha=True).save(str(args.work/name))
                g['file']=name
        page_data={'page':page.number+1,'width':page.rect.width,'height':page.rect.height,'blocks':merged}
        page_data['contentHash']=hashlib.sha256(json.dumps(page_data,sort_keys=True).encode()).hexdigest()
        pages.append(page_data)
    data = {'chapter':chapter, 'source':str(filename), 'sha256':hashlib.sha256(filename.read_bytes()).hexdigest(), 'pages':pages}
    (args.work / f'cp{chapter:02}.source.json').write_text(json.dumps(data, ensure_ascii=False, indent=2))
    manifest.append({'chapter':chapter, 'pages':len(pages), 'blocks':sum(len(p['blocks']) for p in pages), 'chars':sum(len(b['text']) for p in pages for b in p['blocks'])})
    print(manifest[-1], flush=True)
(args.work / 'source-manifest.json').write_text(json.dumps(manifest, indent=2))
