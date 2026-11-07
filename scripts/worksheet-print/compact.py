"""Compact daily worksheets: adaptive two-column pages and matching private keys."""
from pathlib import Path
import importlib.util,json,math,shutil,itertools,sys
import hashlib
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from pypdf import PdfReader

import base
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).parent
W,H=612,792;LEFT=18;RIGHT=594;CW=279;BOTTOM=752
INK=HexColor('#172027');GRAY=HexColor('#485159');GRID=HexColor('#BDC3C7')
LOGO=ROOT/'resources/worksheet-fonts/antocci-physics.png'
assert hashlib.sha256(LOGO.read_bytes()).hexdigest()=='ef5d9c0520264b4cd91a20704b3b727b0ce2fe6373c88ae3e2bee827e2f5fce2'

def p(t,w,size=9.5,leading=None):
    para=Paragraph(base.markup(t),ParagraphStyle('compact',fontName='D',fontSize=size,leading=leading or size*1.17,textColor=INK))
    _,h=para.wrap(w,1000);return para,h

class Compact(base.PDF):
    def __init__(self,path,d,track):
        super().__init__(path,d,track);self.color=INK;self.n=0;self.checks=[];self.layout=[]
    def track_label(self):return self.track.upper()
    def para(self,x,y,w,t,size=9.5,leading=None):
        para,h=p(t,w,size,leading)
        assert y+h<=756,(self.path,self.n,t[:70],y+h)
        para.drawOn(self.c,x,H-y-h);return y+h
    def branded_title(self,title,size,leading,width,max_height):
        self.c.drawImage(str(LOGO),18,H-48,width=30,height=30,mask='auto')
        # Keep the established header height, so no problem workspace moves.
        while p('<b>'+title+'</b>',width,size,leading)[1]>max_height+.01:
            size-=.25
            assert size>=11,(title,size)
        self.para(58,18,width,'<b>'+title+'</b>',size,leading)
    def first_height(self):
        title_h=p('<b>'+self.d['title']+'</b>',375,17,19)[1]
        brand_y=18+title_h+4;field_y=max(55,brand_y+16)
        target_y=field_y+24
        target_h=p('<b>LEARNING TARGET</b>   '+self.d['target'],576,9,10.5)[1]
        goal_y=target_y+target_h+11
        criteria=self.d.get('criteria_by_track',{}).get(self.track,self.d['criteria'])
        criteria_h=sum(p(c,351,8.7,10.3)[1]+3 for c in criteria)
        criterion_end=goal_y+13+criteria_h
        core=f'<b>Core:</b> teacher selects from 1-{self.core_count()}.  <b>Stretch:</b> {self.stretch_label()} after checking your work.'
        core_h=p(core,369,7.8,9)[1]
        end=max(criterion_end+7+core_h,goal_y+60)+8
        return dict(brand_y=brand_y,field_y=field_y,target_y=target_y,goal_y=goal_y,criteria=criteria,criterion_end=criterion_end,core=core,end=end)
    def core_count(self):return sum(q['role']!='stretch' for q in self.d[self.track]) if self.track!='keys' else 0
    def stretch_label(self):
        nums=[q['number'] for q in self.d[self.track] if q['role']=='stretch']
        return str(nums[0]) if len(nums)==1 else f'{nums[0]}-{nums[-1]}'
    def start(self,total,first=False):
        if self.n:self.c.showPage()
        self.n+=1
        if first:
            z=self.first_height()
            self.branded_title(self.d['title'],17,19,335,z['brand_y']-22)
            self.txt(58,z['brand_y'],'antocciphysics',8.5,'DB')
            self.txt(412,18,f"UNIT {self.d['unit']} / DAY {self.d['day']} / {self.track_label()}",8,'DB',GRAY)
            fy=z['field_y']
            for label,x,a,b in [('Name:',18,58,282),('Block:',300,339,391),('Mastery Rating:',409,508,594)]:
                self.txt(x,fy,label,10.5,'DB');self.line(a,fy+11,b,fy+11,INK,.6)
            self.txt(409,fy-11,'(teacher only)',7.5,color=GRAY)
            self.para(18,z['target_y'],576,'<b>LEARNING TARGET</b>   '+self.d['target'],9,10.5)
            gy=z['goal_y'];self.txt(18,gy,'SUCCESS CRITERIA - I can...',8.2,'DB',GRAY)
            y=gy+13
            for n,c in enumerate(z['criteria'],1):
                self.txt(18,y,f'{n}.',8.7,'DB');y=self.para(32,y,351,c,8.7,10.3)+3
            self.para(18,y+7,369,z['core'],7.8,9)
            self.line(396,gy,396,z['end']-8,GRID,.4)
            self.txt(410,gy,'MARZANO SELF-CHECK',8.2,'DB',GRAY)
            for n,label in [(1,'Need help starting'),(2,'Can do part; need help'),(3,'Solve and explain with allowed supports')]:
                y=gy+16+(n-1)*17;self.circle(415,y+3.5,5,None,INK)
                self.txt(412.6,y+.3,n,7.3,'DB');self.para(427,y,167,label,8.2,9.5)
            top=z['end']+9
            self.line(18,z['end'],594,z['end'],GRAY,.55)
        else:
            self.branded_title(self.d['title'],13,15,335,15)
            self.txt(58,38,'antocciphysics',7.5,'DB')
            self.txt(412,18,f"UNIT {self.d['unit']} / DAY {self.d['day']} / {self.track_label()}",8,'DB',GRAY)
            self.txt(412,36,'Continue down each column.',7.2,color=GRAY)
            self.line(18,57,594,57,GRAY,.55);top=66
        self.line(306,top,306,BOTTOM,GRID,.4)
        self.txt(18,765,'Read down the left column, then down the right. Use the open space to draw, calculate and explain.',7.2,color=GRAY)
        self.txt(550,765,f'{self.n} / {total}',7.2,color=GRAY)
        return top

def visual_h(v):
    if not v:return 0
    if v.get('compactHeight'):return v['compactHeight']
    if v['kind']=='table':
        cols=len(v['headers']);rows=[v['headers'],*v['rows']]
        rh=max(19,max(p(str(cell),255/cols-10,8)[1]+8 for row in rows for cell in row))
        return rh*len(rows)
    if v['kind'] in ['graph','vector_grid']:return 134
    return 110

def vector_grid(s,v,x,y,w,h):
    xmin,xmax,ymin,ymax=[v[a] for a in ['xmin','xmax','ymin','ymax']]
    cell=min((w-42)/(xmax-xmin),(h-36)/(ymax-ymin))
    gx=x+26;gy=y+14;right=gx+(xmax-xmin)*cell;bottom=gy+(ymax-ymin)*cell
    px=lambda a:gx+(a-xmin)*cell;py=lambda a:bottom-(a-ymin)*cell
    for a in range(xmin,xmax+1):
        s.line(px(a),gy,px(a),bottom,GRID,.3)
        if a%2==0:s.txt(px(a)-2,bottom+3,str(a),6.5,color=GRAY)
    for a in range(ymin,ymax+1):
        s.line(gx,py(a),right,py(a),GRID,.3)
        if a%2==0:s.txt(gx-14,py(a)-3,str(a),6.5,color=GRAY)
    s.arrow(gx,py(0),right+5,py(0),INK,.7);s.arrow(px(0),bottom,px(0),gy-4,INK,.7)
    s.txt(gx,y,v.get('ylabel','North / +y (m)'),7.2,color=GRAY)
    s.txt(gx,bottom+14,v.get('xlabel','East / +x (m); each square = 1 m'),7.2,color=GRAY)
    for a,b,c,d,label in v.get('arrows',[]):
        s.arrow(px(a),py(b),px(c),py(d),INK,1.1,(3,2) if label=='R' else None)
        ox,oy=v.get('labelOffsets',{}).get(label,(4,-10))
        s.txt((px(a)+px(c))/2+ox,(py(b)+py(d))/2+oy,label,7.5,'DB')

def parts(q):
    a=[]
    if q.get('reference'):
        equation,separator,meaning=q['reference'].partition('<br/>')
        # ReportLab can split a no-break span at a subscript fragment. Pack
        # complete equations explicitly instead, measuring with the actual font.
        lines=[];line='<b>Reference:</b> '
        for part in equation.split(';'):
            candidate=line+('' if line=='<b>Reference:</b> ' else '; ')+part.strip()
            if p(candidate,CW,8.7,11.5)[1]>11.5 and line!='<b>Reference:</b> ':
                lines.append(line);line=part.strip()
            else:line=candidate
        lines.append(line)
        a.append(('<br/>'.join(lines)+separator+meaning,8.7,11.5,6))
    if q.get('worked'):a.append(('<b>Worked reasoning:</b> '+q['worked'],8.7,10.3,7))
    a.append((('<b>Your turn:</b> ' if q['role']=='worked' else '')+q['prompt'],9.5,11.1,6))
    if q.get('frame'):a.append(('<b>Support:</b> '+q['frame'],8.5,10,5))
    return a

def min_height(q,track):
    title_h=p(f"<b>{q['number']:02d}  {q['title']}</b>",CW,9.5,11)[1]
    height=title_h+6+sum(p(t,CW,sz,lead)[1]+gap for t,sz,lead,gap in parts(q))
    v=q.get('visual')
    if v:
        height+=visual_h(v)+10
        if v.get('caption'):height+=p(v['caption'],255,8,9.5)[1]+8
    workspace={'retrieve':34,'worked':32,'model':40,'practice':62 if track=='honors' else 48,'reason':38,'mixed':52,'exit':55,'stretch':90 if track=='honors' else 65}[q['role']]
    return height+q.get('workspace',workspace)+q.get('extraWorkspace',0)+24

def partition(heights,capacities):
    """Contiguous column groups; balancing leaves usable drawing space throughout."""
    n=len(heights);k=len(capacities);prefix=[0]
    for h in heights:prefix.append(prefix[-1]+h)
    best=None
    for cuts in itertools.combinations(range(1,n),k-1):
        ends=(0,*cuts,n);used=[prefix[ends[j+1]]-prefix[ends[j]]+12*(ends[j+1]-ends[j]-1) for j in range(k)]
        if any(u>cap+.01 for u,cap in zip(used,capacities)):continue
        # Penalize very sparse final columns and uneven space per problem.
        spaces=[(cap-u)/(ends[j+1]-ends[j]) for j,(u,cap) in enumerate(zip(used,capacities))]
        mean=sum(spaces)/k;cost=sum((s-mean)**2 for s in spaces)
        if best is None or cost<best[0]:best=(cost,ends,used)
    return best

def draw_block(s,q,x,y,height):
    start=y
    check_y=start+height-11
    y=s.para(x,y,CW,f"<b>{q['number']:02d}  {q['title']}</b>",9.5,11)+6
    for text,size,leading,gap in parts(q):y=s.para(x,y,CW,text,size,leading)+gap
    v=q.get('visual')
    if v:
        hh=visual_h(v);v0={k:a for k,a in v.items() if k!='caption'}
        # A drawing grid is itself workspace. Let it occupy the available blank
        # area so compact vector problems still have squares students can use.
        if v['kind']=='vector_grid':hh=max(hh,min(134,check_y-y-15))
        if v['kind']=='vector_grid':vector_grid(s,v,x+5,y+4,255,hh)
        else:base.draw(s,v0,x+5,y+4,255,hh)
        y+=hh+10
        if v.get('caption'):y=s.para(x+5,y,255,v['caption'],8,9.5)+8
    required_gap=3 if v and v['kind']=='vector_grid' else 20
    assert y+required_gap<check_y,(s.path,q['number'],y,check_y)
    s.txt(x,check_y,'Marzano check - circle:',7.5,'DB')
    for i in range(3):
        cx=x+114+i*21;s.circle(cx,check_y+3.2,5.5,None,INK);s.txt(cx-2.3,check_y+.1,i+1,7.2)
    s.checks.append(q['number']);s.layout.append({'number':q['number'],'page':s.n,'x':x,'top':start,'bottom':start+height,'workSpacePt':round(check_y-y,1)})
