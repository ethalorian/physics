"""Deterministic daily worksheet PDFs, diagrams, keys and public manifest."""
import json, math, re, html
from html.parser import HTMLParser
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[2]
FONT=ROOT/'resources/worksheet-fonts'
for n,f in [('D','DejaVuSans.ttf'),('DB','DejaVuSans-Bold.ttf'),('DI','DejaVuSans-Oblique.ttf'),('DBI','DejaVuSans-BoldOblique.ttf')]:pdfmetrics.registerFont(TTFont(n,str(FONT/f)))
pdfmetrics.registerFontFamily('D',normal='D',bold='DB',italic='DI',boldItalic='DBI')
INK=HexColor('#202E38');MUTED=HexColor('#50606A');GRID=HexColor('#CDD5D9');PALE=HexColor('#F4F6F6')
COLORS={'cpa':HexColor('#256458'),'honors':HexColor('#55416F'),'keys':HexColor('#394C62')}
W,H=612,792
def math_notation(s):
    """Typeset known physics subscripts without treating response blanks as math."""
    s=str(s)
    # Older prose sometimes spells out initial/final or separates a zero index.
    s=re.sub(r'([A-Za-zΑ-ω])_(initial|final|average)\b',lambda m:m[1]+'_'+{'initial':'i','final':'f','average':'avg'}[m[2]],s)
    s=re.sub(r'v_y\s*0\b',r'v<sub>y,i</sub>',s)
    s=re.sub(r'\b([xy])\s+0\b',r'\1<sub>i</sub>',s)
    s=re.sub(r'F_([AB]) on ([AB])',r'F<sub>\1 on \2</sub>',s)
    suffixes='perpendicular|translation|mechanical|projectile|reflected|incident|electrical|circumference|circular|resultant|surface|rotation|absorbed|parallel|predicted|measured|thermal|arrival|driver|driven|flight|escape|spring|before|after|total|sound|water|useful|losses|input|wheel|target|series|start|range|echo|cold|hot|peak|next|now|avg|net|drive|pull|out|top|max|obs|eq|in|by|[xyzifgschrokeAB0123]'
    s=re.sub(r'([A-Za-zΑ-ω])_('+suffixes+r')(?![a-z_])',r'\1<sub>\2</sub>',s)
    return s

def markup(s):
    s=re.sub(r"\*\*([^*]+)\*\*",r"<b>\1</b>",str(s))
    s=re.sub(r"\n+","<br/>",s)
    # Keep given values visually separate from surrounding words.
    s=re.sub(r'\b([A-Za-z]{2,})([+-])(?=\d)',r'\1 \2',str(s))
    s=re.sub(r'\b([A-Za-z]{2,})\.(?=\d)',r'\1 .',s)
    s=re.sub(r'([a-z])\.([A-Z])',r'\1. \2',s)
    s=re.sub(r':(?=[A-Za-z0-9])',': ',s)
    s=html.escape(math_notation(s),quote=False)
    for tag in ['b','i','u','sub','super','nobr']:
        s=s.replace('&lt;'+tag+'&gt;','<'+tag+'>').replace('&lt;/'+tag+'&gt;','</'+tag+'>')
    return s.replace('&lt;br/&gt;','<br/>').replace('<sub>','<sub rise="20%" size="75%">')

def draw_math_text(c,x,baseline,s,size,font,color):
    """Canvas diagram labels use the same notation as paragraph text."""
    rendered=markup(s)
    c.setFillColor(color)
    if '<sub' not in rendered and '<super>' not in rendered:
        c.setFont(font,size);c.drawString(x,baseline,html.unescape(rendered));return
    text=c.beginText(x,baseline)
    class Runs(HTMLParser):
        def __init__(self):super().__init__();self.stack=[]
        def handle_starttag(self,tag,attrs):self.stack.append(tag)
        def handle_endtag(self,tag):
            if self.stack and self.stack[-1]==tag:self.stack.pop()
        def handle_data(self,value):
            sub='sub' in self.stack;sup='super' in self.stack
            text.setFont('DB' if 'b' in self.stack else font,size*.75 if sub or sup else size)
            text.setRise(-size*.2 if sub else size*.35 if sup else 0)
            text.textOut(value)
    Runs().feed(rendered);c.drawText(text)
def paragraph(s,w,size=10.5):
    p=Paragraph(markup(s),ParagraphStyle('p',fontName='D',fontSize=size,leading=size*1.35,textColor=INK))
    _,h=p.wrap(w,1000);return p,h
class PDF:
    def __init__(self,path,d,track):
        path.parent.mkdir(parents=True,exist_ok=True);self.path=path;self.d=d;self.track=track;self.n=0
        self.c=canvas.Canvas(str(path),pagesize=(W,H),pageCompression=1,invariant=1)
        self.c.setTitle(f"Unit {d['unit']} Day {d['day']} | {d['title']} | {track.upper()}")
        self.c.setAuthor('Antocci Physics');self.c.setSubject('Daily practice, learning target, success criteria and Marzano self-assessment')
        self.color=COLORS[track]
    def txt(self,x,y,s,size=10,font='D',color=INK):
        draw_math_text(self.c,x,H-y-size*.82,s,size,font,color)
    def para(self,x,y,w,s,size=10.5):
        p,h=paragraph(s,w,size);assert y+h<=743,(self.path.name,self.n,s[:60],y+h)
        p.drawOn(self.c,x,H-y-h);return y+h
    def line(self,x,y,xx,yy,color=GRID,width=.6,dash=None):
        self.c.saveState();self.c.setStrokeColor(color);self.c.setLineWidth(width)
        if dash:self.c.setDash(*dash)
        self.c.line(x,H-y,xx,H-yy);self.c.restoreState()
    def rect(self,x,y,w,h,fill=None,stroke=GRID):
        self.c.setStrokeColor(stroke);self.c.setFillColor(fill or white);self.c.rect(x,H-y-h,w,h,fill=bool(fill),stroke=1)
    def circle(self,x,y,r=3,fill=None,color=INK):
        self.c.setStrokeColor(color);self.c.setFillColor(fill or white);self.c.circle(x,H-y,r,fill=bool(fill),stroke=1)
    def arrow(self,x,y,xx,yy,color=INK,width=1.3,dash=None):
        self.line(x,y,xx,yy,color,width,dash);a=math.atan2(yy-y,xx-x)
        for z in [-.5,.5]:self.line(xx,yy,xx-6*math.cos(a+z),yy-6*math.sin(a+z),color,width)
    def poly(self,pts,color=INK,width=1):
        for a,b in zip(pts,pts[1:]):self.line(*a,*b,color,width)
    def newpage(self,first=False,sub=None):
        if self.n:self.c.showPage()
        self.n+=1;self.txt(40,30,'ANTOCCI PHYSICS',8.5,'DB',self.color)
        self.txt(338,30,f"UNIT {self.d['unit']}  /  DAY {self.d['day']:02d}  /  {self.track.upper()}",8.5,'DB',self.color)
        y=self.para(40,50,532,self.d['title'],20 if first else 16)
        if first and self.track!='keys':
            self.txt(40,y+12,'Name: ________________________  Class: __________  Date: __________',9.5);y+=39
        else:y+=12
        self.line(40,y,572,y,self.color,1.2)
        self.line(40,752,572,752);self.txt(40,763,f"Unit {self.d['unit']} · Day {self.d['day']} · {self.track.upper() if self.track=='cpa' else self.track.title()} | Antocci Physics",8,color=MUTED)
        self.txt(523,763,f'Page {self.n}',8,color=MUTED)
        if sub:y=self.para(40,y+10,532,sub,10)+8
        return y+13
    def save(self):self.c.save();return self.n

def draw(s,v,x,y,w=240,h=110):
    """Every visual uses a bounded rectangle and an explicit scientific purpose."""
    k=v['kind'];cx=x+w/2;cy=y+h/2
    def label(a,b,t,sz=8):s.txt(a,b,t,sz)
    def arrow(a,b,c,d):s.arrow(a,b,c,d,s.color)
    if k=='table':
        rows=[v['headers'],*v['rows']];rh=h/len(rows);cw=w/len(rows[0])
        for r,row in enumerate(rows):
            for i,t in enumerate(row):
                s.rect(x+i*cw,y+r*rh,cw,rh,PALE if r==0 else None)
                s.para(x+i*cw+5,y+r*rh+4,cw-10,t,8)
    elif k=='graph':
        left=x+36;right=x+w-8;top=y+16;bottom=y+h-23
        xmin=v.get('xmin',0);xmax=v['xmax'];ymin=v.get('ymin',0);ymax=v['ymax']
        px=lambda z:left+(z-xmin)/(xmax-xmin)*(right-left)
        py=lambda z:bottom-(z-ymin)/(ymax-ymin)*(bottom-top)
        nx=min(8,max(4,int(xmax-xmin)))
        for i in range(nx+1):
            val=xmin+(xmax-xmin)*i/nx;xx=px(val);s.line(xx,top,xx,bottom);label(xx-5,bottom+4,f'{val:g}',6.5)
        step=v.get('step',(ymax-ymin)/4);vals=[];z=ymin
        while z<=ymax+step*.01:vals.append(z);z+=step
        if len(vals)>12:vals=[ymin+(ymax-ymin)*i/5 for i in range(6)]
        for val in vals:
            yy=py(val);s.line(left,yy,right,yy);label(x+1,yy-3,f'{val:g}',6.5)
        s.line(left,bottom,right,bottom,INK);s.line(left,top,left,bottom,INK)
        if ymin<0<ymax:s.line(left,py(0),right,py(0),MUTED,1)
        label(x,y-1,v.get('ylabel','y'),8);label(x+40,y+h-8,v.get('xlabel','x'),8)
        if v.get('points'):
            pts=[(px(a),py(b)) for a,b in v['points']];s.poly(pts,s.color,1.8)
            for a,b in pts:s.circle(a,b,2,s.color,s.color)
    elif k=='numberline':
        lo=v['lo'];hi=v['hi'];px=lambda z:x+12+(z-lo)/(hi-lo)*(w-24)
        yy=y+h-25;s.arrow(x+5,yy,x+w,yy)
        step=max(1,math.ceil((hi-lo)/12))
        for z in range(int(lo),int(hi)+1,step):s.line(px(z),yy-3,px(z),yy+3,INK);label(px(z)-4,yy+8,str(z),7)
        pts=v['points'];labels=v.get('labels') or (['start','turn','end'] if len(pts)==3 else ['start','end'] if len(pts)==2 else ['start']*len(pts))
        for i,z in enumerate(pts):
            yy2=y+15+i*18;s.circle(px(z),yy2,2,s.color,s.color);label(px(z)+4,yy2-5,labels[i],7)
            if i<len(pts)-1:arrow(px(z),yy2+7,px(pts[i+1]),yy2+7)
        label(x,y+h-1,v.get('xlabel','Position (m); right is positive'),7)
    elif k=='range':
        a=x+25;b=x+w-25;yy=cy
        s.line(a,yy,b,yy,s.color,3)
        for xx,name,z in [(a,'lower',v['lo']),(cx,'middle',v['mid']),(b,'upper',v['hi'])]:
            s.line(xx,yy-10,xx,yy+10,INK);label(xx-18,yy+17,'____' if v.get('blank') else f'{z} {v["unit"]}',8);label(xx-16,yy-28,name,7)
    elif k=='forces':
        s.circle(cx,cy,3,s.color,s.color)
        dirs={'right':(1,0),'left':(-1,0),'up':(0,-1),'down':(0,1)}
        vals=[float(v[a]) for a in dirs if a in v and isinstance(v[a],(int,float))];mx=max(vals or [1])
        for a,(dx,dy) in dirs.items():
            if a in v:
                length=20+26*(float(v[a])/mx if isinstance(v[a],(int,float)) else .6);xx=cx+dx*length;yy=cy+dy*length
                arrow(cx+dx*5,cy+dy*5,xx,yy);label(xx+(4 if dx>=0 else -35),yy-8,(f'{v[a]} N' if isinstance(v[a],(int,float)) else str(v[a])),8)
        if v.get('blank'):label(x+4,y+h-10,'Add and label force arrows.',8)
    elif k in ['pair','interaction','thermal','particles','sizes']:
        for i in range(2):
            xx=x+w*(.25+.5*i);r=16 if k!='sizes' else 12+12*i
            if k=='thermal':
                is_bath=(v.get('labels') or [''])[0].startswith('Cup');ww=(32 if i==0 else 92) if is_bath else 56
                s.rect(xx-ww/2,y+28,ww,40,None,INK)
            elif k=='particles':
                s.rect(xx-43,y+14,86,65,None,INK)
                for j in range(6):
                    a=xx-28+(j%3)*24;b=y+28+(j//3)*30;s.circle(a,b,2,s.color,s.color);arrow(a+3,b,a+8+2*(j%3)+5*i,b-3-(j%2)*3)
            else:s.circle(xx,cy-8,r,None,INK)
            t=(v.get('labels') or [v.get('left','A'),v.get('right','B')])[i]
            s.para(xx-52,y+h-25,104,t,8)
        if k=='pair':s.line(x+w*.25,y+h-44,x+w*.75,y+h-44,GRID,1,(3,3));label(cx-8,y+h-41,v.get('distance','r'),8)
    elif k in ['carts','collision']:
        for i in range(2):
            xx=x+18+i*w*.50;s.rect(xx,y+35,66,26,None,INK)
            for xx2 in [xx+13,xx+53]:s.circle(xx2,y+67,5,None,INK)
            t=v.get('labels',['Cart A','Cart B'])[i];s.para(xx-5,y+79,w*.48,t,8)
        s.line(x,y+74,x+w,y+74)
        if k=='collision':label(x,y+5,'Before contact: add velocity arrows.',8)
    elif k in ['ramp','heights','projectile','fall']:
        if k=='ramp':
            s.poly([(x+15,y+80),(x+w-15,y+80),(x+w-15,y+18),(x+15,y+80)],INK)
            s.circle(cx,y+44,8,None,INK)
            if v.get('angle'):label(x+50,y+68,v['angle'],8)
        elif k=='heights':
            s.line(x,y+90,x+w,y+90)
            for i,hh in enumerate([25,65]):
                xx=x+60+i*120;s.rect(xx,y+90-hh,25,10,None,INK);s.line(xx+34,y+90,xx+34,y+90-hh,INK,1,(2,2));label(xx+38,y+72-hh/2,v['labels'][i],9)
        elif k=='fall':
            for i in range(4):s.circle(cx,y+8+i*i*8,4,None,s.color)
            label(x,y+5,'Equal time intervals',8);arrow(cx+40,y+18,cx+40,y+90)
        else:
            s.line(x+15,y+85,x+w-10,y+85)
            if v.get('angled'):pts=[(x+20+i*(w-40)/30,y+85-60*4*(i/30)*(1-i/30)) for i in range(31)]
            else:
                s.rect(x+5,y+20,32,65,None,INK);pts=[(x+37+i*(w-57)/30,y+20+65*(i/30)**2) for i in range(31)]
            s.poly(pts,s.color,1.5);label(x+60,y+96,'Add velocity / acceleration arrows.',7)
    elif k in ['orbit','ellipse','trajectory','field']:
        if k=='trajectory':
            arrow(x+10,y+78,x+w-5,y+78);arrow(x+w*.7,y+94,x+w*.7,y+5);s.circle(x+w*.7,y+78,5,None,INK)
            s.circle(x+30,y+78,3,s.color,s.color);label(x+15,y+59,'Start',8);label(x+w*.7+7,y+81,'Earth',8)
        elif k in ['orbit','ellipse']:
            a=75 if k=='ellipse' else 44;b=33 if k=='ellipse' else 44
            s.c.setStrokeColor(INK);s.c.ellipse(cx-a,H-cy-b,cx+a,H-cy+b,stroke=1,fill=0)
            sx=cx-math.sqrt(a*a-b*b) if k=='ellipse' else cx;s.circle(sx,cy,6,s.color,s.color)
            s.circle(cx+a,cy,3,INK,INK);label(cx+a+5,cy-8,'B' if k=='ellipse' else 'object',7)
            if k=='ellipse':s.circle(cx-a,cy,3,INK,INK);label(cx-a-13,cy-8,'A',7)
        else:
            s.circle(cx,cy,14,None,INK);label(cx-4,cy-5,'+' if v.get('mode')=='electric' else 'M',9)
            for i in range(8):
                a=i*math.pi/4;s.line(cx+24*math.cos(a),cy+24*math.sin(a),cx+44*math.cos(a),cy+44*math.sin(a),GRID,1,(2,2))
            label(x,y+h-9,'Add arrowheads to show field direction.',7)
    elif k in ['flow','bars','work','spring','vector','heating']:
        if k=='flow' and v.get('layout')=='branches':
            s.para(x,y+40,65,v['labels'][0],8);arrow(x+62,y+48,x+90,y+48)
            s.rect(x+92,y+30,45,38,PALE);label(x+97,y+45,'Engine',8)
            arrow(x+139,y+40,x+174,y+20);arrow(x+139,y+58,x+174,y+79)
            s.para(x+177,y+14,68,v['labels'][1],8);s.para(x+177,y+73,68,v['labels'][2],8)
        elif k=='flow':
            labels=v['labels'];ww=(w-26*(len(labels)-1))/len(labels)
            for i,t in enumerate(labels):
                xx=x+i*(ww+26);s.rect(xx,y+25,ww,48,PALE);s.para(xx+5,y+33,ww-10,t,8)
                if i<len(labels)-1 and v.get('layout')!='categories':arrow(xx+ww+3,y+49,xx+ww+23,y+49)
        elif k=='bars':
            mx=max(v['values'] or [1]) or 1;n=len(v['values']);bw=w/n
            for i,(t,val) in enumerate(zip(v['labels'],v['values'])):
                xx=x+i*bw+10;hh=60*val/mx;s.rect(xx,y+75-hh,bw-24,hh,PALE,s.color);label(xx,y+60-hh,f'{val} {v.get("unit","")}',8);s.para(xx,y+82,bw-12,t,8)
        elif k=='work':
            s.rect(x+40,y+40,50,30,None,INK);arrow(x+90,y+55,x+w-20,y+55);s.para(x+100,y+20,w-100,v['force'],8);s.para(x+25,y+88,w-35,v['distance'],8)
        elif k=='spring':
            s.line(x+15,y+20,x+15,y+80,INK,2);pts=[(x+15,y+50)]+[(x+35+i*12,y+50+(-1)**i*12) for i in range(11)]+[(x+175,y+50)];s.poly(pts);s.rect(x+175,y+35,32,30,None,INK);label(x+40,y+90,'Mark equilibrium and displacement x.',7)
        elif k=='vector':
            dx=18*v['x'];dy=18*v['y'];ox=x+45;oy=y+86
            arrow(ox,oy,ox+dx,oy);arrow(ox,oy,ox+dx,oy-dy);s.line(ox+dx,oy,ox+dx,oy-dy,GRID,1,(2,2));label(ox+10,oy+7,f'x = {v["x"]}',8);label(ox+dx+8,oy-dy/2,f'y = {v["y"]}',8)
        else:
            arrow(x+28,y+85,x+w-8,y+85);arrow(x+28,y+85,x+28,y+7);s.poly([(x+28,y+75),(x+90,y+42),(x+155,y+42),(x+w-16,y+15)],s.color,1.8);label(x+52,y+94,'Energy added',8);label(x,y,'Temperature',8)
    elif k in ['wave','pulses','pulse','interference','longitudinal','refraction','diffraction','echo','doppler','spectrum','mirror','lens']:
        if k=='pulses':
            for i,(ww,hh) in enumerate([(40,50),(80,25)]):
                xx=x+10+i*120;yy=y+75
                s.line(xx,yy,xx+105,yy,INK);s.line(xx,yy,xx,y+12,INK)
                s.poly([(xx,yy),(xx+10,yy),(xx+10+ww/2,yy-hh),(xx+10+ww,yy)],s.color,1.5)
                label(xx+24,y+91,'Time',8);label(xx+4,y+2,'A' if i==0 else 'B',8)
            label(x,y-10,'Force (same scales)',8)
        elif k in ['wave','pulse','interference']:
            s.line(x+10,cy,x+w-10,cy,MUTED,.8,(3,3))
            if k=='wave':pts=[(x+10+i*(w-20)/100,cy-25*math.sin(i/100*4*math.pi)) for i in range(101)];s.poly(pts,s.color,1.5)
            else:
                pts=[(x+10,cy),(x+45,cy),(x+62,cy-26),(x+79,cy),(x+125,cy)];s.poly(pts,s.color,1.5);arrow(x+42,y+18,x+88,y+18)
                if k=='pulse':s.line(x+w-20,y+10,x+w-20,y+92,INK,3)
                elif k=='interference':s.poly([(x+130,cy),(x+164,cy),(x+180,cy-26),(x+196,cy),(x+w-5,cy)],INK,1.5);s.arrow(x+205,y+18,x+160,y+18)
            label(x+10,y+h-12,'Sketch and label your response.',7)
        elif k=='longitudinal':
            for row in range(3):
                for j in range(40):
                    xx=x+8+j*(w-16)/39+3*math.sin(j*.8);s.circle(xx,y+32+row*14,1,INK,INK)
            arrow(x+20,y+12,x+w-20,y+12);label(x+20,y+91,'Label dense and sparse regions.',8)
        elif k in ['refraction','mirror']:
            s.line(x+15,cy,x+w-15,cy,INK,1.5);s.line(cx,y+8,cx,y+h-8,MUTED,1,(3,3));arrow(cx-24,cy-42,cx,cy);label(cx+8,y+8,'normal',8);label(x+10,cy+25,'Add outgoing ray.',8)
        elif k=='diffraction':
            s.line(cx,y+5,cx,cy-12,INK,3);s.line(cx,cy+12,cx,y+h-5,INK,3)
            for i in range(4):s.line(x+15+22*i,y+12,x+15+22*i,y+h-12,s.color)
            arrow(x+20,cy,x+85,cy);label(cx+10,cy-4,'Sketch spreading.',7)
        elif k=='echo':
            s.rect(x+15,y+30,35,35,None,INK);s.line(x+w-20,y+12,x+w-20,y+94,INK,2);arrow(x+56,y+39,x+w-27,y+39)
            if not v.get('oneway'):arrow(x+w-27,y+61,x+56,y+61)
            label(x+5,y+82,'Source',8);label(x+w-49,y+98,'Target',8)
        elif k=='doppler':
            # Blank wavefront scaffold; student adds compression on the forward side.
            s.circle(cx,cy,7,INK,INK);arrow(cx+13,cy,cx+67,cy);label(x+5,y+4,'Source moves right. Add wavefronts.',8)
        elif k=='spectrum':
            for i,t in enumerate(['Radio','IR','Visible','UV','X-ray']):s.rect(x+i*w/5,y+30,w/5,35,PALE);label(x+i*w/5+3,y+43,t,7)
            label(x,y+81,'Label increasing frequency and wavelength.',7)
        else:
            # Outline both lens forms and blank parallel incident rays.
            for i in range(2):
                xx=x+65+i*w*.52;s.line(xx-48,cy,xx+48,cy,GRID)
                if i==0:
                    pts=[(xx,cy-35),(xx-10,cy-18),(xx-13,cy),(xx-10,cy+18),(xx,cy+35),(xx+10,cy+18),(xx+13,cy),(xx+10,cy-18),(xx,cy-35)]
                else:pts=[(xx-12,cy-35),(xx+12,cy-35),(xx+5,cy-15),(xx+4,cy),(xx+5,cy+15),(xx+12,cy+35),(xx-12,cy+35),(xx-5,cy+15),(xx-4,cy),(xx-5,cy-15),(xx-12,cy-35)]
                s.poly(pts,INK)
                for yy in [cy-18,cy+18]:arrow(xx-45,yy,xx-16,yy)
    elif k=='circuit':
        mode=v.get('mode','simple');a=x+30;b=x+w-25;top=y+20;bot=y+90;mid=(top+bot)/2
        # Battery at left; positive (long plate) on top.
        s.line(a,top,b,top,INK);s.line(a,bot,b,bot,INK);s.line(a,top,a,mid-7,INK);s.line(a,mid+7,a,bot,INK)
        s.line(a-13,mid-7,a+13,mid-7,INK,1.5);s.line(a-7,mid+7,a+7,mid+7,INK,1.5);label(a-25,mid-15,'+',8);label(a-22,mid+6,'−',8)
        def resistor(xx,yy):
            s.line(xx,top,xx,yy-14,INK);s.rect(xx-8,yy-14,16,28,None,INK);s.line(xx,yy+14,xx,bot,INK)
        if mode in ['parallel','combination']:
            resistor(b,mid);resistor(b-65,mid)
            if mode=='combination':s.rect(a+18,top-7,32,14,white,INK)
        elif mode=='series':
            s.line(b,top,b,bot,INK);s.rect(a+45,top-7,34,14,white,INK);s.rect(a+45,bot-7,34,14,white,INK)
        elif mode=='motor':
            s.line(b,top,b,mid-14,INK);s.circle(b,mid,14,None,INK);label(b-5,mid-5,'M',10);s.line(b,mid+14,b,bot,INK)
            # Closed switch drawn across a gap.
            s.rect(a+43,top-5,38,10,white,white);s.circle(a+46,top,2);s.circle(a+78,top,2);s.line(a+48,top,a+76,top,INK)
        else:resistor(b,mid)
    elif k in ['magnet','wire','coil']:
        if k=='magnet':s.rect(cx-45,cy-14,90,28,PALE,INK);s.line(cx,cy-14,cx,cy+14,INK);label(cx-32,cy-5,'N',11);label(cx+23,cy-5,'S',11)
        elif k=='wire':s.circle(cx,cy,8);s.circle(cx,cy,2,INK,INK);label(x,y+4,'Current out of page (dot). Add field arrows.',7)
        else:
            for i in range(7):s.c.setStrokeColor(INK);s.c.ellipse(x+80+i*10,H-y-80,x+105+i*10,H-y-25,stroke=1,fill=0)
            s.rect(x+10,y+40,45,22,PALE,INK);label(x+14,y+46,'N | S',8);arrow(x+15,y+18,x+60,y+18);label(x+75,y+94,'Coil',8)
    elif k=='chassis':
        s.rect(x+60,y+10,w-120,h-20,None,INK)
        for yy in [y+30,y+h-30]:
            s.line(x+35,yy,x+w-35,yy,INK)
            for xx in [x+28,x+w-44]:s.rect(xx,yy-13,16,26,PALE,INK)
        label(cx-20,cy-5,'Top view',8);arrow(x+5,y+70,x+5,y+20)
    elif k=='gears':
        for xx,r,t in [(x+65,20,'Driver'),(x+127,42,'Driven')]:
            pts=[(xx+(r+(3 if i%2 else 0))*math.cos(i*math.pi/20),cy+(r+(3 if i%2 else 0))*math.sin(i*math.pi/20)) for i in range(41)]
            s.poly(pts);s.circle(xx,cy,4);label(xx-20,y+h-5,t,8)
    else:raise ValueError('Unhandled visual: '+k)
    if v.get('caption'):s.para(x,y+h+8,w,v['caption'],8)
