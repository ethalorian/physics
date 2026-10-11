"""Replace translated text, preserving the source illustrations and all page numbers."""
import argparse, copy, hashlib, html, io, json, re
from pathlib import Path
import pymupdf as fitz

def illustration_labels(labels):
    """Running heads/captions are already translated in their original positions."""
    excluded=r'^(?:figure\s+[\d.]+|chapter\s+\d+|think!?|answer\s*:?\s*[\d.]+|concept\s+check)$'
    seen=set()
    result=[]
    for label in labels:
        key=re.sub(r'\s+',' ',label['english']).strip().lower()
        if re.fullmatch(excluded,key) or key in seen: continue
        seen.add(key)
        result.append(label)
    return result

def clear_source_annotations(page,blocks):
    # The source highlights and small colored checkmarks refer to English word
    # positions. Clear only those known marks inside prose, before reflowing it.
    # Artwork, equation rules, callout backgrounds, and all other paths stay put.
    colors=[(1.0,.97778,.72058),(0.0,.59057,.67665),(.85327,.27797,.19664)]
    prose=[fitz.Rect(b['bbox']) for b in blocks if not b.get('equation') and 'Minion' in b['font'] and len(b['text'])>100]
    for drawing in page.get_drawings():
        color=drawing.get('color') or drawing.get('fill')
        if not color or not any(max(abs(x-y) for x,y in zip(color,c))<.006 for c in colors): continue
        original_rect=fitz.Rect(drawing['rect'])
        rect=fitz.Rect(original_rect)
        stroke=(drawing.get('width') or 0)/2+1
        rect=rect+(-stroke,-stroke,stroke,stroke)
        if any(box.x0-.5<=original_rect.x0 and original_rect.x1<=box.x1+.5 and box.y0<=original_rect.y0 and original_rect.y1<=box.y1 for box in prose):
            page.draw_rect(rect,color=None,fill=(1,1,1),overlay=True)

def block_rotation(original_page,block):
    # Rotated graph axes and the periodic table retain the source orientation.
    first=block['lines'][0][0]['bbox']
    for raw in original_page.get_text('dict')['blocks']:
        if raw['type']!=0: continue
        for line in raw['lines']:
            if any(max(abs(a-b) for a,b in zip(first,s['bbox']))<.05 for s in line['spans']):
                x,y=line['dir']
                if abs(x)<.1: return 90 if y<0 else 270
                return 180 if x<0 else 0
    return 0

def repeated_footer(text):
    for count in (3,2):
        match=re.fullmatch(r'(.{10,}?)'+r'(?:\s+\1)'*(count-1),text)
        if match: return match[1]
    return text

def visible_source_blocks(item,translated,original_page):
    # The publisher PDF contains earlier template text beneath later opaque
    # page fills. Extraction sees it; readers do not. Never resurrect that text.
    prepared=copy.deepcopy(item);es=copy.deepcopy(translated)
    rectangles=[d for d in original_page.get_drawings() if d.get('fill') and d.get('fill_opacity',0)>.99 and len(d['items'])==1 and d['items'][0][0]=='re']
    normalize=lambda s:re.sub(r'\s+','',s)
    traces=[]
    for trace in original_page.get_texttrace():
        box=fitz.Rect(trace['bbox'])
        hidden=trace['type']==3 or trace['opacity']==0 or any(d['seqno']>trace['seqno'] and d['rect'].contains(box) for d in rectangles)
        traces.append((normalize(''.join(chr(c[0]) for c in trace['chars'])),box,hidden))
    def is_hidden(span):
        box=fitz.Rect(span['bbox'])
        # get_text() includes leading-space advances in its rectangle whereas
        # texttrace starts at the first painted glyph.
        matches=[hidden for text,rect,hidden in traces if normalize(span['text'])==text and (abs(box.x0-rect.x0)<.1 or span['text'][:1].isspace() and -.1<=rect.x0-box.x0<=max(20,box.height)) and abs(box.x1-rect.x1)<.2 and rect.intersects(box)]
        return bool(matches) and all(matches)
    visible=[]
    for b in prepared['blocks']:
        spans=[s for line in b['lines'] for s in line if s['text'].strip()]
        words=[s for s in spans if re.search(r'[A-Za-z]{2}',s['text'])]
        if spans and (all(is_hidden(s) for s in spans) or words and all(is_hidden(s) for s in words)):continue
        if re.fullmatch(r'[\d\s]*(?:(?:ASSESS|REVIEW|\(continued\))\s*)+',b['text']) and any(is_hidden(s) for s in spans):
            lines=[[s for s in line if not is_hidden(s)] for line in b['lines']]
            b['lines']=[line for line in lines if line]
            b['text']=' '.join(s['text'].strip() for line in b['lines'] for s in line)
            es['blocks'][b['id']]=b['text'].replace('ASSESS','EVALUACIÓN').replace('REVIEW','REPASO').replace('(continued)','(continuación)')
            box=fitz.Rect(b['lines'][0][0]['bbox'])
            for line in b['lines']:
                for s in line:box|=fitz.Rect(s['bbox'])
            b['bbox']=list(box)
        visible.append(b)
    footer_seen=set();unique=[]
    for b in reversed(visible):
        if b['bbox'][1]>item['height']-50:
            key=repeated_footer(b['text'])
            if key in footer_seen:continue
            footer_seen.add(key)
        unique.append(b)
    prepared['blocks']=list(reversed(unique))
    # Decorative chapter numbers are sometimes extracted in the same block as
    # a distant title or big-idea sentence. Leave numerals in their original art.
    raw_spans=[s for raw in original_page.get_text('dict')['blocks'] if raw['type']==0 for line in raw['lines'] for s in line['spans']]
    for b in prepared['blocks']:
        if b['bbox'][1]>130:continue
        def large_number(s):
            return re.fullmatch(r'\d+',s['text'].strip()) and any(abs(s['bbox'][0]-raw['bbox'][0])<.05 and abs(s['bbox'][1]-raw['bbox'][1])<.05 and raw['size']>=30 for raw in raw_spans)
        split_lines=[]
        for line in b['lines']:
            if any(large_number(s) for s in line) and any(not large_number(s) for s in line):
                split_lines.extend([[s] for s in line])
            else:split_lines.append(line)
        b['lines']=split_lines
        numeral_lines=[]
        for i,line in enumerate(b['lines']):
            text=''.join(s['text'] for s in line).strip()
            if not re.fullmatch(r'\d+',text):continue
            if all(any(abs(s['bbox'][0]-raw['bbox'][0])<.05 and abs(s['bbox'][1]-raw['bbox'][1])<.05 and raw['size']>=30 for raw in raw_spans) for s in line):numeral_lines.append(i)
        if not numeral_lines or len(numeral_lines)==len(b['lines']):continue
        pattern=r'\s*'.join(re.escape(''.join(s['text'] for s in b['lines'][i]).strip()) for i in numeral_lines)
        prefix=pattern if numeral_lines==list(range(len(numeral_lines))) else ''
        suffix=pattern if numeral_lines==list(range(len(b['lines'])-len(numeral_lines),len(b['lines']))) else ''
        if prefix:
            es['blocks'][b['id']]=re.sub(r'^\s*'+prefix+r'\s*','',es['blocks'][b['id']])
            b['text']=re.sub(r'^\s*'+prefix+r'\s*','',b['text'])
        elif suffix:
            es['blocks'][b['id']]=re.sub(r'\s*'+suffix+r'\s*$','',es['blocks'][b['id']])
            b['text']=re.sub(r'\s*'+suffix+r'\s*$','',b['text'])
        else:
            pattern=r'(?<!\d)'+pattern+r'(?!\d)'
            if len(re.findall(pattern,b['text']))!=1 or len(re.findall(pattern,es['blocks'][b['id']]))!=1:continue
            b['text']=re.sub(pattern,'',b['text'])
            es['blocks'][b['id']]=re.sub(pattern,'',es['blocks'][b['id']])
        b['lines']=[line for i,line in enumerate(b['lines']) if i not in numeral_lines]
        box=fitz.Rect(b['lines'][0][0]['bbox'])
        for line in b['lines']:
            for s in line:box|=fitz.Rect(s['bbox'])
        b['bbox']=list(box)
    return prepared,es

def contour_rectangles(block):
    # Prose is sometimes shaped around a photograph or drawing. Its union box
    # crosses that artwork; preserve the source line contour during reflow.
    if block.get('equation') or block.get('paint_background') or len(block['lines'])<5:return None
    rows=[]
    for line in block['lines']:
        box=fitz.Rect(line[0]['bbox'])
        for s in line:box|=fitz.Rect(s['bbox'])
        if rows and abs(rows[-1].y0-box.y0)<2:rows[-1]|=box
        else:rows.append(box)
    if len(rows)<5 or any(b.y0<a.y0 for a,b in zip(rows,rows[1:])):return None
    left=min(r.x0 for r in rows);right=max(r.x1 for r in rows)
    if max(r.x0 for r in rows)-left>22 and not block.get('extra_redactions'):return None
    if max(r.x1 for r in rows[:-1])-min(r.x1 for r in rows[:-1])<38:return None
    if sum(r.x1<right-30 for r in rows[:-1])<3:return None
    rects=[]
    for i,row in enumerate(rows):
        bottom=rows[i+1].y0 if i+1<len(rows) else row.y1+2
        if bottom-row.y0<block['size']*.9:return None
        # The final source line is ragged text, not the outline of the image.
        edge=max(row.x1,rows[i-1].x1) if i==len(rows)-1 else row.x1
        rects.append(fitz.Rect(left,row.y0,edge+2,bottom))
    return rects

def insert_contour(page,content,css,block,archive):
    rects=contour_rectangles(block)
    if not rects:return None
    def layout(scale,draw=False):
        # Scale glyph images along with the text, retaining superscripts.
        markup=re.sub(r'((?:width|height):)([\d.]+)pt',lambda m:m[1]+str(float(m[2])*scale)+'pt',content)
        style=re.sub(r'font-size:[\d.]+pt',f'font-size:{block["size"]*scale}pt',css)
        style=style.replace('body {','body {margin:0;padding:0;')
        story=fitz.Story(html=markup,user_css=style,em=block['size']*scale,archive=archive)
        stream=io.BytesIO();writer=fitz.DocumentWriter(stream);device=writer.begin_page(page.rect)
        more=1;y=rects[0].y0;line_height=block['size']*scale*1.15+1
        flow=[]
        while y+line_height<=rects[-1].y1+.01:
            right=min(r.x1 for r in rects if r.y0<y+line_height and r.y1>y)
            flow.append(fitz.Rect(rects[0].x0,y,right,y+line_height));y+=line_height
        for rect in flow:
            more,_=story.place(rect);story.draw(device)
            if not more:break
        writer.end_page();writer.close()
        if not more and draw:
            overlay=fitz.open(stream=stream.getvalue(),filetype='pdf')
            page.show_pdf_page(page.rect,overlay,0)
        return not more
    low=.4;high=1.0
    if layout(high):scale=high
    else:
        assert layout(low),('contour cannot fit',block['id'])
        for _ in range(9):
            mid=(low+high)/2
            if layout(mid):low=mid
            else:high=mid
        scale=low
    assert layout(scale,True)
    return scale

def prose_groups(original_page,item,translated,work,chapter):
    """Rejoin prose split into tiny spans solely because it contains inline math.

    Every translated fragment stays in order; untouched operators and variables
    are copied from the source into the new line, preserving their appearance.
    Actual displayed equations and fraction rules stay in their original geometry.
    """
    prepared=copy.deepcopy(item)
    es=copy.deepcopy(translated)
    by_rect={tuple(round(v,2) for v in span['bbox']):b for b in item['blocks'] for line in b['lines'] for span in line}
    removed=set()
    additions=[]
    drawings=original_page.get_drawings()
    for raw in original_page.get_text('dict')['blocks']:
        if raw['type']!=0 or len(raw['lines'])<3: continue
        if any(b.get('paint_background') and fitz.Rect(b['bbox']).intersects(raw['bbox']) for b in item['blocks']): continue
        spans=[s for l in raw['lines'] for s in l['spans']]
        original_text=' '.join(s['text'] for s in spans)
        if len(re.findall(r'[A-Za-z]{2,}',original_text))<12 or not re.search(r'[.!?]',original_text): continue
        if any(abs(l['dir'][0]-1)>.01 for l in raw['lines']): continue
        members={}
        for s in spans:
            b=by_rect.get(tuple(round(v,2) for v in s['bbox']))
            if b: members[b['id']]=b
        if len(members)<3 or not all(b.get('equation') for b in members.values()): continue
        box=fitz.Rect(raw['bbox'])
        # A horizontal fraction rule is a separate vector path; leave it intact.
        if any(box.contains(d['rect']) and d['rect'].height<1 and d['rect'].width>10 and max(d.get('color') or (1,1,1))<.5 for d in drawings): continue
        group=copy.deepcopy(next(iter(members.values())))
        group_id='group_'+next(iter(members))
        group.update(id=group_id,bbox=list(box),glyphs={},equation=False,lines=[[{'bbox':s['bbox'],'text':s['text']} for s in spans]])
        tokens={};parts=[];seen=set()
        for i,s in enumerate(spans):
            b=by_rect.get(tuple(round(v,2) for v in s['bbox']))
            if b:
                if b['id'] in seen: continue
                seen.add(b['id'])
                part=es['blocks'][b['id']]
                for token,glyph in b.get('glyphs',{}).items():
                    verbal=es.get('glyphTranslations',{}).get(b['id'],{}).get(token)
                    if verbal is not None: part=part.replace(token,verbal)
                    else:
                        new='[GLYPH_GROUP'+chr(65+len(tokens)//26)+chr(65+len(tokens)%26)+']'
                        tokens[new]=glyph;part=part.replace(token,new)
                parts.append(part)
            elif s['text'].strip():
                token='[GLYPH_GROUP'+chr(65+len(tokens)//26)+chr(65+len(tokens)%26)+']'
                filename=f'cp{chapter:02}.p{item["page"]:03}.{group_id}.math{i}.png'
                original_page.get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(s['bbox']),alpha=True).save(str(work/filename))
                tokens[token]={'bbox':s['bbox'],'text':s['text'],'sup':bool(s['flags']&1),'file':filename}
                parts.append(token)
        group['glyphs']=tokens
        es['blocks'][group_id]=' '.join(parts)
        removed.update(members)
        additions.append(group)
    prepared['blocks']=[b for b in prepared['blocks'] if b['id'] not in removed]+additions
    return prepared,es

def compact_equation_labels(item,translated):
    # A long Spanish word must not turn a source subscript into 2-point text.
    # Keep the original equation intact and translate cramped verbal labels in
    # the same-page key, as with lettering embedded in the illustrations.
    preserved=set();labels=[]
    for b in item['blocks']:
        if not b.get('equation'): continue
        english=b['text'];spanish=translated['blocks'][b['id']]
        for token,glyph in b.get('glyphs',{}).items():
            english=english.replace(token,glyph['text'])
            spanish=spanish.replace(token,translated.get('glyphTranslations',{}).get(b['id'],{}).get(token,glyph['text']))
        if english==spanish or len(english.split())>7 or not re.search(r'[A-Za-z]{2}',english): continue
        rect=fitz.Rect(b['bbox'])
        threshold=min(8,b['size'])
        width=fitz.get_text_length(spanish,fontname='tiro' if 'Minion' in b['font'] else 'helv',fontsize=threshold)
        if width>rect.width*1.08 and rect.height<b['size']*2:
            preserved.add(b['id'])
            labels.append({'english':english,'spanish':spanish})
    return preserved,labels

def separate_callout_title(item,translated,original_page):
    # Some source PDF blocks join a distant "think!" label to the neighboring
    # body paragraph. Give the label its own box instead of spanning two columns.
    prepared=copy.deepcopy(item);es=copy.deepcopy(translated);extra=[]
    spans=[s for b in original_page.get_text('dict')['blocks'] if b['type']==0 for l in b['lines'] for s in l['spans']]
    for b in prepared['blocks']:
        if len(b['lines'])<2 or ''.join(s['text'] for s in b['lines'][0]).strip().lower()!='think!': continue
        match=re.match(r'\s*¡?piensa!?[.:]?\s*',es['blocks'][b['id']],re.I)
        if not match: continue
        first=b['lines'][0]
        first_rect=fitz.Rect(first[0]['bbox'])
        rest_rect=fitz.Rect(b['lines'][1][0]['bbox'])
        for line in b['lines'][1:]:
            for s in line: rest_rect|=fitz.Rect(s['bbox'])
        if abs(first_rect.x0-rest_rect.x0)<120: continue
        original_span=next(s for s in spans if max(abs(x-y) for x,y in zip(s['bbox'],first[0]['bbox']))<.05)
        title=copy.deepcopy(b);title.update(id='title_'+b['id'],text='think!',bbox=list(first_rect),lines=[first],glyphs={},equation=False,size=original_span['size'],font=original_span['font'],color=original_span['color'])
        es['blocks'][title['id']]='¡piensa!';extra.append(title)
        es['blocks'][b['id']]=es['blocks'][b['id']][match.end():]
        b['text']=re.sub(r'^think!\s*','',b['text'],flags=re.I)
        b['lines']=b['lines'][1:];b['bbox']=list(rest_rect)
    prepared['blocks']+=extra
    return prepared,es

def separate_web_caption(item,translated,original_page):
    # One extracted block can join a publisher link card in the right column
    # to a figure caption in the left. Preserve the card independently so its
    # URL cannot cause the neighboring caption to remain in English.
    prepared=copy.deepcopy(item);es=copy.deepcopy(translated);extra=[];removed=set()
    raw_spans=[s for raw in original_page.get_text('dict')['blocks'] if raw['type']==0 for line in raw['lines'] for s in line['spans']]
    for b in prepared['blocks']:
        if not re.search(r'PHSchool\.com|www\.SciLinks\.org',b['text'],re.I): continue
        source_match=re.search(r'\b(?:FIGURE\s+\d|REVIEW|ASSESS)\b',b['text'])
        target_match=re.search(r'\b(?:FIGURA\s+\d|REPASO|EVALUACIÓN)\b',es['blocks'][b['id']])
        if not source_match or not target_match: continue
        split=next((i for i,line in enumerate(b['lines']) if re.match(r'\s*(?:FIGURE\s+\d|REVIEW\b|ASSESS\b)',''.join(s['text'] for s in line))),None)
        assert split is not None and split>0,('combined web caption',b['id'])
        card=copy.deepcopy(b)
        card.update(id='card_'+b['id'],text=b['text'][:source_match.start()].strip(),lines=b['lines'][:split],glyphs={})
        card_box=fitz.Rect(card['lines'][0][0]['bbox'])
        for line in card['lines']:
            for s in line: card_box|=fitz.Rect(s['bbox'])
        card['bbox']=list(card_box)
        es['blocks'][card['id']]=es['blocks'][b['id']][:target_match.start()].strip()
        es['blocks'][b['id']]=es['blocks'][b['id']][target_match.start():]
        b['text']=b['text'][source_match.start():];b['lines']=b['lines'][split:]
        caption_box=fitz.Rect(b['lines'][0][0]['bbox'])
        for line in b['lines']:
            for s in line: caption_box|=fitz.Rect(s['bbox'])
        b['bbox']=list(caption_box);extra.append(card)
        if re.match(r'\s*(?:REVIEW|ASSESS)',b['text']):
            first=b['lines'][0][0]
            original=next((s for s in raw_spans if max(abs(a-c) for a,c in zip(s['bbox'],first['bbox']))<.05),None)
            if original:b.update(size=original['size'],font=original['font'],color=original['color'])
            checked,es=visible_source_blocks({**item,'blocks':[b]},es,original_page)
            if checked['blocks']:b.update(checked['blocks'][0])
            else:removed.add(b['id'])
    prepared['blocks']=[b for b in prepared['blocks'] if b['id'] not in removed]+extra
    return prepared,es

def source_web_cards(item,translated):
    # These old publisher link cards use cramped, independently aligned fields.
    # Preserve their original URLs/codes, with a readable Spanish key below.
    ids=set();labels=[]
    for b in item['blocks']:
        if re.search(r'For:\s*Visit:|Web Code:|PHSchool\.com|www\.SciLinks\.org|^Links on\b|^Self-Assessment\b',b['text'],re.I):
            ids.add(b['id'])
            if b['text']!=translated['blocks'][b['id']]:labels.append({'english':b['text'],'spanish':translated['blocks'][b['id']]})
    return ids,labels

def apply_layout_overrides(item,translated,original_page):
    prepared=copy.deepcopy(item);es=copy.deepcopy(translated)
    source_blocks={b['id']:b for b in prepared['blocks']}
    for i,override in enumerate(es.get('layoutOverrides',[])):
        ids=set(override['ids']);box=fitz.Rect(override['bbox'])
        members=[b for key,b in source_blocks.items() if key in ids]
        assert len(members)==len(ids),(item['page'],'unknown override block',ids)
        background=override.get('background',[1,1,1])
        if max(background)>1: background=[v/255 for v in background]
        fills=[d for d in original_page.get_drawings() if d.get('fill') and d['rect'].contains(box) and len(d['items'])==1 and d['items'][0][0]=='re']
        if fills: background=min(fills,key=lambda d:(d['rect'].get_area(),-d['seqno']))['fill']
        block=copy.deepcopy(members[0]);block.update(id='override_'+str(i),text=override['text'],bbox=list(box),lines=[[{'bbox':list(box),'text':override['text']}]],glyphs={},equation=False,paint_background=background)
        block['extra_redactions']=[s['bbox'] for member in members for line in member['lines'] for s in line]+[r for member in members for r in member.get('extra_redactions',[])]
        es['blocks'][block['id']]=override['text']
        prepared['blocks']=[b for b in prepared['blocks'] if b['id'] not in ids]+[block]
    return prepared,es

parser=argparse.ArgumentParser()
parser.add_argument('work',type=Path)
parser.add_argument('output',type=Path)
parser.add_argument('--chapter',type=int)
parser.add_argument('--page',type=int)
parser.add_argument('--require-labels',action='store_true')
args=parser.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
renderer_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
report=[]
for source in sorted(args.work.glob('*.source.json')):
    data=json.loads(source.read_text())
    n=data['chapter']
    if args.chapter and n!=args.chapter: continue
    translations=[args.work/f'cp{n:02}.p{p["page"]:03}.es.json' for p in data['pages']]
    selected=[p for p in data['pages'] if not args.page or p['page']==args.page]
    if not all(translations[p['page']-1].exists() and json.loads(translations[p['page']-1].read_text()).get('contentHash')==p['contentHash'] for p in selected):
        print(f'WAIT chapter={n}',flush=True)
        continue
    if args.require_labels and not all((args.work/f'cp{n:02}.p{p["page"]:03}.labels.es.json').exists() for p in selected):
        print(f'WAIT LABELS chapter={n}',flush=True)
        continue
    original=fitz.open(data['source'])
    doc=fitz.open()
    chapter_report=[]
    inputs=[]
    for item in selected:
        index=item['page']-1
        translation_bytes=translations[index].read_bytes()
        inputs.append({'file':translations[index].name,'sha256':hashlib.sha256(translation_bytes).hexdigest()})
        translated=json.loads(translation_bytes)
        assert translated['sourceHash']==data['sha256']
        assert translated['contentHash']==item['contentHash']
        assert set(translated['blocks'])=={b['id'] for b in item['blocks']}
        item,translated=visible_source_blocks(item,translated,original[index])
        item,translated=apply_layout_overrides(item,translated,original[index])
        item,translated=separate_callout_title(item,translated,original[index])
        item,translated=separate_web_caption(item,translated,original[index])
        item,translated=prose_groups(original[index],item,translated,args.work,n)
        equation_keys,equation_labels=compact_equation_labels(item,translated)
        card_keys,card_labels=source_web_cards(item,translated)
        # Normalize cropped source coordinates before editing.
        label_file=args.work/f'cp{n:02}.p{item["page"]:03}.labels.es.json'
        label_bytes=label_file.read_bytes() if label_file.exists() else None
        inputs.append({'file':label_file.name,'sha256':hashlib.sha256(label_bytes).hexdigest() if label_bytes is not None else None})
        labels=illustration_labels((json.loads(label_bytes)['labels'] if label_bytes is not None else [])+equation_labels+card_labels)
        # Add a compact key below the original page; the chapter page count and
        # printed-page identity remain exactly the same in both languages.
        columns=4 if len(labels)>24 and all(max(len(x['english']),len(x['spanish']))<40 for x in labels) else 2
        rows=[]
        midpoint=(len(labels)+1)//2
        for row in range(midpoint if columns==4 else len(labels)):
            cells=[]
            for position in ([row,row+midpoint] if columns==4 else [row]):
                label=labels[position] if position<len(labels) else {'english':'','spanish':''}
                cells.extend([html.escape(label['english']),html.escape(label['spanish'])])
            rows.append('<tr>'+''.join('<td>'+cell+'</td>' for cell in cells)+'</tr>')
        key_html='<h3>Ilustraciones y ecuaciones: traducción de las palabras</h3><table>'+''.join(rows)+'</table>'
        key_css='body{font-family:sans-serif;font-size:10pt;color:#243444;margin:0}h3{font-size:12pt;margin:0 0 7pt}table{width:100%;border-collapse:collapse}td{width:'+str(100//columns)+'%;padding:4pt 8pt;border-bottom:0.5pt solid #ccd5df;vertical-align:top}'
        key_height=0
        if labels:
            story=fitz.Story(html=key_html,user_css=key_css)
            more,filled=story.place(fitz.Rect(0,0,item['width']-64,10000))
            assert not more
            key_height=filled[3]+48
        page=doc.new_page(width=item['width'],height=item['height']+key_height)
        page.show_pdf_page(fitz.Rect(0,0,item['width'],item['height']),original,index)
        unchanged=equation_keys|card_keys|{b['id'] for b in item['blocks'] if translated['blocks'][b['id']]==b['text'] and not translated.get('glyphTranslations',{}).get(b['id']) and not b.get('paint_background')}
        for b in item['blocks']:
            # Keep untouched math and units as original vector text. Replacing
            # their tiny superscripts with inline images needlessly shrinks them.
            if b['id'] in unchanged: continue
            for line in b['lines']:
                for span in line:
                    # Tight character bounds avoid erasing neighboring formulas.
                    rect=fitz.Rect(span['bbox'])
                    page.add_redact_annot(rect,fill=False,cross_out=False)
            for extra in b.get('extra_redactions',[]): page.add_redact_annot(fitz.Rect(extra),fill=False,cross_out=False)
        page.apply_redactions(images=0,graphics=0)
        clear_source_annotations(page,item['blocks'])
        for b in item['blocks']:
            if b.get('paint_background'): page.draw_rect(fitz.Rect(b['bbox']),color=None,fill=b['paint_background'],overlay=True)
        if n==5 and item['page']==4 and translated['blocks'].get('11','').count('√')>=2:
            # The two source radicals are vector outlines, absent from extracted
            # text. The checked translation restores them beside each numeral.
            for rect in [(339.8,537.5,356,552.7),(314.8,551.5,331,566.7)]:
                page.draw_rect(fitz.Rect(rect),color=None,fill=(1,1,1),overlay=True)
        original_content=original[index].get_text('dict')['blocks']
        obstacles=[fitz.Rect(s['bbox']) for raw in original_content if raw['type']==0 for line in raw['lines'] for s in line['spans']]
        obstacles += [fitz.Rect(raw['bbox']) for raw in original_content if raw['type']!=0]
        outlines=[drawing['rect'] for drawing in original[index].get_drawings()]
        obstacles += outlines
        rotations={tuple(round(v,2) for v in s['bbox']):(90 if line['dir'][1]<0 else 270) if abs(line['dir'][0])<.1 else 180 if line['dir'][0]<0 else 0 for raw in original_content if raw['type']==0 for line in raw['lines'] for s in line['spans']}
        for b in item['blocks']:
            if b['id'] in unchanged: continue
            text=translated['blocks'][b['id']]
            if b['bbox'][1]>item['height']-50: text=repeated_footer(text)
            rect=fitz.Rect(b['bbox'])
            rotation=rotations.get(tuple(round(v,2) for v in b['lines'][0][0]['bbox']),0)
            # Small safe breathing room; never cross another text block.
            other=[fitz.Rect(x['bbox']) for x in item['blocks'] if x['id']!=b['id']]
            right=min([r.x0-2 for r in other if r.x0>=rect.x1 and r.y0<rect.y1 and r.y1>rect.y0]+[page.rect.width-16])
            bottom=min([r.y0-1 for r in other if r.y0>=rect.y1 and r.x0<rect.x1 and r.x1>rect.x0]+[page.rect.height-16])
            if not rotation:
                rect.x1=min(rect.x1+(0 if b.get('equation') else 5),right)
                if not b.get('equation') and len(text)>50:
                    # Use existing blank space before shrinking Spanish prose,
                    # bounded by source figures, formulas, and callout borders.
                    bottom=min([bottom]+[r.y0-1 for r in obstacles if r.y0>=rect.y1 and r.x0<rect.x1 and r.x1>rect.x0]+[r.y1-3 for r in outlines if r.contains(fitz.Rect(b['bbox'])) and r.get_area()<item['width']*item['height']*.8])
                    rect.y1=min(rect.y1+max(2,b['size']*1.5),max(rect.y1,bottom))
                else: rect.y1=min(rect.y1+2,bottom)
            color=f'#{b["color"]:06x}'
            family='serif' if 'Minion' in b['font'] else 'sans-serif'
            weight='bold' if re.search('Bold|Black|Heavy|Corpus',b['font']) else 'normal'
            css=f'* {{margin:0;padding:0}} body {{font-family:{family};font-size:{b["size"]}pt;line-height:1.04;color:{color};font-weight:{weight};}}'
            content=html.escape(text).replace('\n','<br>')
            for token,glyph in b.get('glyphs',{}).items():
                verbal=translated.get('glyphTranslations',{}).get(b['id'],{}).get(token)
                if verbal is not None:
                    content=content.replace(token,html.escape(verbal))
                    continue
                if glyph['sup'] and re.fullmatch(r'[\d+−-]+',glyph['text'].strip()):
                    superscript=glyph['text'].strip().translate(str.maketrans('0123456789+−-','⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻'))
                    content=content.replace(token,superscript)
                    continue
                w=glyph['bbox'][2]-glyph['bbox'][0];h=glyph['bbox'][3]-glyph['bbox'][1]
                image_tag=f'<img src="{glyph["file"]}" style="width:{w}pt;height:{h}pt;vertical-align:baseline">'
                content=content.replace(token,('<sup>'+image_tag+'</sup>') if glyph['sup'] else image_tag)
            content=re.sub(r'((?:<img [^>]+>\s*){2,})',r'<span style="white-space:nowrap">\1</span>',content)
            archive=fitz.Archive(str(args.work))
            contour_scale=insert_contour(page,content,css,b,archive) if not rotation else None
            if contour_scale is None:spare,scale=page.insert_htmlbox(rect,content,css=css,scale_low=0,rotate=rotation,archive=archive)
            else:spare,scale=0,contour_scale
            assert spare>=0,(n,item['page'],b['id'])
            chapter_report.append({'page':item['page'],'block':b['id'],'font':round(b['size']*scale,2),'scale':round(scale,3),'sourceFont':b['size'],'characters':len(text),'equation':bool(b.get('equation'))})
        if labels:
            key_rect=fitz.Rect(32,item['height']+16,item['width']-32,page.rect.height-16)
            spare,scale=page.insert_htmlbox(key_rect,key_html,css=key_css,scale_low=1)
            assert spare>=0,(n,item['page'],'diagram key overflow')
        if args.page or item['page'] in [1,2,len(data['pages'])]:
            page.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(str(args.output/f'cp{n:02}.p{item["page"]:03}.png'))
    dest=args.output/(f'cp{n:02}.sample.pdf' if args.page else f'cp{n:02}.pdf')
    doc.set_metadata({'title':f'Física conceptual - Capítulo {n} - Español','subject':'Traducción al español de la copia de clase. Numeración de páginas original.'})
    doc.set_language('es')
    doc.save(dest,garbage=4,deflate=True)
    dest.with_suffix('.manifest.json').write_text(json.dumps({'chapter':n,'pages':len(doc),'sourceHash':data['sha256'],'rendererHash':renderer_hash,'inputs':inputs,'pdfSha256':hashlib.sha256(dest.read_bytes()).hexdigest()},indent=2))
    dest.with_suffix('.layout.json').write_text(json.dumps({'chapter':n,'blocks':chapter_report},indent=2))
    report.append({'chapter':n,'pages':len(doc),'file':str(dest),'blocks':chapter_report})
    (args.output/'layout-report.json').write_text(json.dumps(report,indent=2))
    print(f'RENDERED chapter={n} pages={len(doc)} blocks={len(chapter_report)} minFont={min((x["font"] for x in chapter_report),default=0):.1f}',flush=True)
(args.output/'layout-report.json').write_text(json.dumps(report,indent=2))
