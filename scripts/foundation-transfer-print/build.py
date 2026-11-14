"""Build matching Section E pages, preserving every preceding packet page.

Usage: python build.py GRAPHIC_DIR OUTPUT_DIR [--install]
Binder rules: P-1/P-2, G-1/G-2, C-2/C-4/C-8, T-1/T-3, FL-2/FL-3.
"""
from pathlib import Path
from io import BytesIO
import hashlib, html, json, re, sys, zipfile
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pypdf import PdfReader, PdfWriter, Transformation
import pdfplumber

REPO=Path(__file__).resolve().parents[2]
TMP=Path(sys.argv[1]); OUT=Path(sys.argv[2]); OUT.mkdir(parents=True,exist_ok=True)
INSTALL='--install' in sys.argv
DATA=json.loads((TMP/'source.json').read_text())
PROMPTS=json.loads((REPO/'resources/foundation-transfer-print/prompts.json').read_text())
FONT=REPO/'public/decks/unit-1-cpa/fonts'
for n,f in [('News','news400.ttf'),('NewsBold','news600.ttf'),('Mono','mono400.ttf'),('MonoBold','mono600.ttf')]:
    pdfmetrics.registerFont(TTFont(n,str(FONT/f)))
pdfmetrics.registerFontFamily('News',normal='News',bold='NewsBold',italic='News',boldItalic='NewsBold')
W,H=612,792; L,R=64.8,590.4; WIDTH=R-L; GAP=12; COL=(WIDTH-GAP)/2
INK=HexColor('#222222'); GRAY=HexColor('#555555'); LINE=HexColor('#bcbcbc')
manifest=[]; compiled={}

def markup(s):
    s=html.escape(s,quote=False).replace('–','-').replace('—','-')
    return re.sub(r'([+−±-]?\d+(?:\.\d+)?(?:\s?(?:km/s²|km/s|m/s²|m/s|km|kg|min|N|s))?)',r'<b>\1</b>',s)

def sheet(day,track,sei):
    # Keep the two explicitly approved Day 9 student copies verbatim.
    if day==9 and not sei:
        return PdfReader(REPO/f'resources/foundation-transfer-print/day-09-{track}-approved.pdf').pages[0]
    p=PROMPTS[day-1]; a=DATA['assignments'][day-1]; label='HONORS' if track=='honors' else 'CPA / MVP'
    tag=label+(' / SEI' if sei else '')
    buffer=BytesIO(); c=canvas.Canvas(buffer,pagesize=(W,H)); checks=[]
    def text(x,top,s,font='News',size=11,color=INK,align='left'):
        width=pdfmetrics.stringWidth(s,font,size); left=x-width if align=='right' else x-width/2 if align=='center' else x
        assert left>=L-.1 and left+width<=R+.1,(day,tag,'text width',s)
        c.setFillColor(color);c.setFont(font,size)
        if align=='right':c.drawRightString(x,H-top-size,s)
        elif align=='center':c.drawCentredString(x,H-top-size,s)
        else:c.drawString(x,H-top-size,s)
    def box(x,t,w,h,width=.7):
        c.setStrokeColor(INK);c.setLineWidth(width);c.rect(x,H-t-h,w,h,stroke=1,fill=0)
    def rule(x,t,x2,color=LINE,width=.5):
        c.setStrokeColor(color);c.setLineWidth(width);c.line(x,H-t,x2,H-t)
    def para(x,top,s,width=WIDTH,size=11.2,leading=12.5,limit=None,color=INK):
        q=Paragraph(s,ParagraphStyle('p',fontName='News',fontSize=size,leading=leading,textColor=color))
        _,height=q.wrap(width,1000)
        if limit:assert top+height<=limit,(day,tag,'paragraph height',s,top+height,limit)
        q.drawOn(c,x,H-top-height); checks.append({'top':top,'bottom':top+height,'text':s})
        return top+height
    def icon(kind,x,top):
        c.saveState();c.translate(x,H-top-32*.56);c.scale(.56,.56);c.setStrokeColor(INK);c.setLineWidth(1.8)
        if kind==0:
            c.line(5,7,25,27);c.line(4,13,13,4);c.line(18,28,28,18);c.rect(6,20,8,8);c.rect(20,4,8,8)
        else:
            c.roundRect(12,13,8,18,4);q=c.beginPath();q.moveTo(8,19);q.lineTo(8,17);q.curveTo(8,6,24,6,24,17);q.lineTo(24,19);c.drawPath(q);c.line(16,9,16,3);c.line(10,3,22,3)
        c.restoreState()
    text(L,22,'ANTOCCI PHYSICS / UNIT 1','MonoBold',8.5)
    text(R,22,tag,'MonoBold',8.5,align='right')
    title=DATA['titles'][day-1]
    # Long source titles retain their font size and wrap deliberately when needed.
    if pdfmetrics.stringWidth(title,'NewsBold',25)>WIDTH-65:
        text(L,43,title,'NewsBold',22)
    else:text(L,43,title,'NewsBold',25)
    c.saveState();c.setStrokeColor(INK);c.setLineWidth(.65)
    t=c.beginText(R-51,H-75);t.setFont('NewsBold',40);t.setTextRenderMode(1);t.textOut(f'{day:02}');c.drawText(t);c.restoreState()
    box(L,81,80,17,.85);text(L+40,83,'SECTION E','MonoBold',9,align='center')
    text(L+92,84,'FINAL MEETING / TEAM TRANSFER','Mono',8.7)
    text(L,109,'Name','Mono',9);rule(L+32,119,L+245)
    text(L+268,109,'Partner','Mono',9);rule(L+315,119,R)
    para(L,129,'<b>Our goal:</b> '+html.escape(p['goal']),size=11.8,limit=148)
    text(L,153,'CHOOSE ONE JOB TOGETHER','MonoBold',8.8)
    for i in range(2):
        x=L+i*(COL+GAP);box(x,169,COL,70);icon(i,x+10,178);box(x+COL-19,180,8,8)
        job=a[1 if i==0 else 3].upper().replace('LIVE SCIENCE BROADCASTER','SCIENCE BROADCASTER')
        # Role name must fit without crossing the student's checkbox.
        if pdfmetrics.stringWidth(job,'MonoBold',8.5)>COL-62:
            job={'MISSION SYSTEMS ENGINEER':'SYSTEMS ENGINEER','SCIENCE GRAPHICS PRODUCER':'GRAPHICS PRODUCER','SCIENCE GRAPHICS EDITOR':'GRAPHICS EDITOR','TEST-RANGE BROADCASTER':'TEST BROADCASTER','WEATHER-DESK PRESENTER':'FORECAST PRESENTER'}.get(job,job)
        text(x+34,179,job,'MonoBold',8.5)
        para(x+11,198,markup(p['jobs'][i]),width=COL-22,size=11.2,leading=12.5,limit=237)
    cue=('<b>Word help:</b> '+html.escape(p['words'])) if sei else 'Point to a clue. Keep your first marks; add the update using the color key.'
    para(L,245,cue,limit=260)
    rule(L,264,R,INK,.7)
    # The task setup carries quantities that are not repeated inside the figure.
    setup='XJ is drifting right. At minute 3, one camera can aim at one window: A, B or C.' if day==9 else a[0]
    para(L,266,markup(setup),size=10.8,leading=12,limit=290)
    # Diagram occupies y=290..490.39 and is merged as a vector PDF below.
    top=500; height=170; rx=L+COL+GAP
    for x in [L,rx]:box(x,top,COL,height,.85);rule(x,top+27,x+COL,INK,.65)
    text(L+11,506,'01  OUR FIRST CALL','MonoBold',10)
    text(rx+11,506,'02  OUR REVISED CALL','MonoBold',10)
    first=p['first']
    if day==9 and track=='honors':first='Where should the camera look? Include a signed velocity and say what you expect to stay the same.'
    end=para(L+11,534,'<b>'+html.escape(first)+'</b>',width=COL-22,size=11.2,leading=12.5,limit=573)
    if sei:para(L+11,end+4,html.escape(p['frame']),width=COL-22,size=10.5,leading=12,limit=602,color=GRAY)
    para(rx+11,534,'<b>Wait for the reveal. Keep your first call.</b>',width=COL-22,size=10.7,leading=12,limit=548)
    text(rx+11,552,'New clue:','News',10.5);rule(rx+57,564,rx+COL-11)
    revised=p['revised']
    if day==9 and track=='honors':revised='How far did XJ move in the last minute? Use that result in your revised call.'
    end=para(rx+11,572,html.escape(revised),width=COL-22,size=11.2,leading=12.5,limit=611)
    if sei:para(rx+11,end+3,'Now we would say ___ because ___.',width=COL-22,size=10.2,leading=11.5,limit=625,color=GRAY)
    discussion=p['honors'] if track=='honors' else DATA['challenges'][day-1]
    para(L,678,'<b>Switch speakers.</b> '+html.escape(discussion),size=11,leading=12,limit=702)
    rule(L,711,R)
    colors=[('GREEN','speeding up'),('RED','slowing down'),('YELLOW','steady /<br/>balanced'),('BLUE','position /<br/>displacement'),('PURPLE','velocity'),('ORANGE','forces'),('PENCIL','other marks')]
    cw=WIDTH/7
    for i,(name,meaning) in enumerate(colors):
        x=L+i*cw;box(x,714,7,7);text(x+11,711.5,name,'MonoBold',9)
        para(x,726,meaning,width=cw-5,size=9,leading=9.3,color=GRAY)
    text((L+R)/2,753,f'STUDENT CHOICE BINDER / {tag.replace(" / ","-")} / DAY {day:02} / SECTION E','Mono',7.5,GRAY,'center')
    text((L+R)/2,765,f'8.5 x 11 in / 3-HOLE PUNCH LEFT / FILE WITH DAY {day} NOTES','Mono',7,GRAY,'center')
    c.showPage();c.save();buffer.seek(0)
    result=PdfReader(buffer).pages[0]
    graphic=PdfReader(TMP/f'day-{day}-graphic.pdf').pages[0]
    scale=WIDTH/float(graphic.mediabox.width); gh=float(graphic.mediabox.height)*scale
    result.merge_transformed_page(graphic,Transformation().scale(scale).translate(L,H-290-gh))
    return result

archive=OUT/'original-packets.zip'
if not archive.exists():
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for track in ['cpa','honors']:
            for day in range(1,23):
                for kind in ['choice','sei']:
                    rel=f'{track}/day-{day:02}-{kind}.pdf'
                    z.write(REPO/'public/foundations/unit-1/print'/rel,rel)

for track in ['cpa','honors']:
    for sei in [False,True]:
        key=track+('-sei' if sei else ''); compiled[key]=PdfWriter()
        for day in range(1,23):
            kind='sei' if sei else 'choice';rel=f'{track}/day-{day:02}-{kind}.pdf'
            dest=OUT/'packets'/rel;dest.parent.mkdir(parents=True,exist_ok=True)
            with zipfile.ZipFile(archive) as z: original=PdfReader(BytesIO(z.read(rel)))
            assert len(original.pages)==(6 if sei else 4)
            assert 'SECTION E' in original.pages[-1].extract_text()
            page=sheet(day,track,sei); updated=PdfWriter()
            for old in original.pages[:-1]:updated.add_page(old)
            updated.add_page(page);compiled[key].add_page(page)
            updated.add_metadata({'/Title':f'Antocci Physics | Day {day:02} | {key.upper()} | Frayer, doodle and transfer','/Author':'Antocci Physics'})
            with dest.open('wb') as f:updated.write(f)
            check=PdfReader(dest)
            assert all(old.get_contents().get_data()==new.get_contents().get_data() for old,new in zip(original.pages[:-1],check.pages[:-1]))
            with pdfplumber.open(dest) as pdf:
                pg=pdf.pages[-1]; assert (pg.width,pg.height)==(612,792)
                bad=[c for c in pg.chars if c['x0']<L-.2 or c['x1']>R+.2 or c['bottom']>774.1]
                assert not bad,(rel,[(c['text'],c['x0'],c['x1'],c['bottom']) for c in bad])
                assert 'OUR FIRST CALL' in pg.extract_text() and 'OUR REVISED CALL' in pg.extract_text()
            manifest.append({'path':rel,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'pages':len(check.pages),'preservedPages':len(original.pages)-1,'graphicPhase':0})
            if INSTALL:(REPO/'public/foundations/unit-1/print'/rel).write_bytes(dest.read_bytes())
        name={'cpa':'CPA MVP','honors':'Honors','cpa-sei':'CPA MVP SEI','honors-sei':'Honors SEI'}[key]
        book=OUT/f'Unit 1 - {name} - Transfer pages.pdf'
        compiled[key].compress_identical_objects(remove_identicals=True,remove_orphans=True)
        compiled[key].add_metadata({'/Title':f'Antocci Physics | Unit 1 | {name} | 22 transfer pages','/Author':'Antocci Physics'})
        with book.open('wb') as f:compiled[key].write(f)

(OUT/'manifest.json').write_text(json.dumps({'packets':manifest,'revisedPages':88,'preservedPages':352,'rules':['P-1','P-2','G-1','G-2','C-2','C-4','C-8','T-1','T-3','FL-2','FL-3']},indent=2))
print('Built 88 transfer sheets; preserved all 352 preceding packet pages.')
