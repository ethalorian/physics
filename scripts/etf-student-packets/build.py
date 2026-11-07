"""Build the print edition from the same meeting and reading records used by the lessons."""
import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen.canvas import Canvas
from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'src/data/etf-original'
OUT = ROOT / 'public/etf-notebooks'
OUT.mkdir(exist_ok=True, parents=True)
MEETINGS = json.loads((DATA / 'meetings.json').read_text())
CHAPTERS = {c['number']: c for c in json.loads((DATA / 'chapters.json').read_text())}
PROJECTS = {1:'Product design', 2:'Buildings and neighborhoods', 3:'The patented boat', 4:'Communication and control'}
INK, MUTE, LINE = '#162d33', '#3c5559', '#93a2a1'
X, RIGHT, W = 44, 568, 524


class Packet:
    def __init__(self, meeting):
        self.m = meeting
        self.path = OUT / f"project-{meeting['project']}-meeting-{meeting['day']:02}.pdf"
        self.c = Canvas(str(self.path), pagesize=letter, invariant=1)
        self.c.setTitle(f"MVP Engineering | {meeting['task']} | {meeting['title']}")
        self.c.setAuthor('MVP Engineering')
        self.page = 0

    def label(self, x, y, s, font='Helvetica', size=10.5, color=INK):
        self.c.setFillColor(colors.HexColor(color))
        self.c.setFont(font, size)
        self.c.drawString(x, y, s)

    def para(self, s, size=11, bold=False, gap=8):
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        for line in simpleSplit(s, font, size, W):
            self.label(X, self.y, line, font, size)
            self.y -= size + 3
        self.y -= gap

    def rule(self, x1, y1, x2, y2, color=LINE, thick=.55):
        self.c.setStrokeColor(colors.HexColor(color))
        self.c.setLineWidth(thick)
        self.c.line(x1, y1, x2, y2)

    def start(self, label, title):
        if self.page:
            self.end()
        self.page += 1
        m = self.m
        self.label(X, 747, 'MVP ENGINEERING     /     STUDENT FIELD NOTES', 'Helvetica-Bold', 9)
        self.label(X, 722, f"PROJECT {m['project']}    /    MEETING {m['day']:02}    /    {PROJECTS[m['project']].upper()}", size=9, color=MUTE)
        self.y = 695
        self.para(title, 19, True, 0)
        self.para(label, 11, gap=9)
        self.label(X, self.y, 'Name',size=9); self.rule(72,self.y-2,295,self.y-2)
        self.label(310,self.y,'Team',size=9); self.rule(337,self.y-2,445,self.y-2)
        self.label(457,self.y,'Date',size=9); self.rule(482,self.y-2,RIGHT,self.y-2)
        self.y -= 28

    def end(self):
        if self.y < 38:
            raise ValueError(f"Page overflow {self.path.name} p{self.page} ({self.y})")
        self.rule(X,37,RIGHT,37)
        task = self.m['task']
        self.label(X,23,f"MVP Engineering  /  ETF {task}  /  Student response packet",size=8,color=MUTE)
        self.label(510,23,f'Sheet {self.page}',size=8,color=MUTE)
        self.c.showPage()

    def finish(self):
        self.end()
        self.c.save()

    def head(self,n,title):
        self.label(X,self.y,str(n).zfill(2),'Helvetica-Bold',11,MUTE)
        self.label(X+25,self.y,title,'Helvetica-Bold',13)
        self.y-=21

    def lines(self,n=2):
        for _ in range(n):
            self.y-=12
            self.rule(X,self.y,RIGHT,self.y)
            self.y-=7
        self.y-=6

    def table(self,headers,rows,heights=24,widths=None):
        widths = widths or [W/len(headers)]*len(headers)
        assert abs(sum(widths)-W)<.1
        hs = [simpleSplit(h,'Helvetica-Bold',9,w-12) for h,w in zip(headers,widths)]
        hh = 12 + max(map(len,hs))*11
        top=self.y
        self.c.setFillColor(colors.HexColor('#e8eeed'))
        self.c.rect(X,top-hh,W,hh,stroke=0,fill=1)
        x=X
        for col,w in zip(hs,widths):
            for i,line in enumerate(col):
                self.label(x+6,top-14-11*i,line,'Helvetica-Bold',9)
            x+=w
        y=top-hh
        self.rule(X,top,RIGHT,top)
        for row in rows:
            self.rule(X,y,RIGHT,y)
            x=X
            for value,w in zip(row,widths):
                for i,line in enumerate(simpleSplit(str(value),'Helvetica',9,w-12)):
                    assert (i+1)*11<heights
                    self.label(x+6,y-15-i*11,line,size=9)
                x+=w
            y-=heights
        self.rule(X,y,RIGHT,y)
        x=X
        for w in [0]+list(widths):
            x+=w; self.rule(x,top,x,y)
        self.y=y-18

    def grid(self,height,step=12):
        top=self.y
        for x in range(X,RIGHT+1,step): self.rule(x,top,x,top-height,'#d6dddd',.3)
        for off in range(0,height+1,step): self.rule(X,top-off,RIGHT,top-off,'#d6dddd',.3)
        self.c.setLineWidth(.65)
        self.c.setStrokeColor(colors.HexColor(LINE))
        self.c.rect(X,top-height,W,height)
        self.y-=height+17


def building(p):
    p.start('Task 2.1   /   Neighborhood evidence', 'Where would a mixed-use building help?')
    p.para('Design for someone who lives in the building and needs to reach a nearby business or service. Start with a place you know. A public intersection or school area works.', gap=8)
    p.head(1,'Read the neighborhood')
    p.para('In the app, open Peter Park’s “Redesigning America,” printed pp. 83-87. Find one planning choice that changes a resident’s trip. Record the page and explain the effect in your words.')
    p.lines(3)
    p.head(2,'Walk through a real trip')
    p.para('Name a public starting point, a destination and a way to get there. What helps someone reach it? Where would a sidewalk, crossing, entrance or closer service make a difference?')
    p.lines(3)
    p.head(3,'Consider two responses to sprawl')
    p.para('Sprawl spreads homes and destinations farther apart. Describe one local effect. Compare two ways a change to the neighborhood could help.')
    p.table(['Possible change','Who benefits and how?'],[['',''],['','']],42,[212,312])
    p.para('Proposed site and the resident or service user you will design for',bold=True)
    p.lines(1)
    p.start('Task 2.1   /   Field measurements', 'How much space does the design need?')
    p.head(4,'Calibrate a walking step')
    p.para('Mark a start point. Walk 10 ordinary steps in a straight, safe space. Your partner measures the distance in feet. Repeat three times. You can also direct a partner or use a tape for the room survey.')
    p.table(['Walk','Distance for 10 steps (ft)','Distance ÷ 10 (ft/step)'],[['1'],['2'],['3'],['Average']],25,[83,215,226])
    p.head(5,'Survey a room')
    p.para('Use the same walker and count steps along two sides. Multiply each count by average ft/step. For a direct tape survey, enter the measured feet and mark the counts N/A.')
    p.table(['Room and side','Steps','Estimated ft','Tape check (ft)','Difference (ft)'],[['Length'],['Width']],30,[115,70,110,120,109])
    p.para('Area = length × width. Show both dimensions with units and calculate area in ft².')
    p.lines(2)
    p.para('How many people usually use this room? Divide ft² by people. Name a second space that would need more or less room per person and explain why.')
    p.lines(2)
    p.start('Task 2.1   /   Design brief and first plan','Draw a route a resident can actually use')
    p.head(6,'Set the brief')
    p.para('Include housing access and one business or community service. Describe observable signs of success and real limits on space, materials, energy use or access.')
    p.table(['Success criterion','Constraint or limit'],[['',''],['',''],['','']],23)
    p.head(7,'Draw the ground floor')
    p.para('Label the street, both uses, entrances and one dimension with units. Trace one trip from a dwelling entrance to the service. Mark any point where that route leaves the building.')
    p.grid(228)
    p.para('What feature of your plan responds to the need on sheet 1?')
    p.lines(2)
    p.start('Task 2.1   /   Partner check and individual exit','Test the trip and revise the design')
    p.head(8,'Give the plan to another reader')
    p.para('Ask a partner to trace the trip without hints. Record their starting point, their destination and the first place they paused or found a barrier.')
    p.lines(3)
    p.head(9,'Revise one part of the route')
    p.para('Draw the revised entrance or route below. Label what moved. Add an arrow or dimension showing why the revision makes the trip work better.')
    p.grid(138)
    p.para('Which criterion or constraint guided your revision?')
    p.lines(2)
    p.head(10,'Individual explanation')
    p.para(p.m['exit'])
    p.lines(3)
    p.para('Turn in these sheets as directed. In the online lesson, enter your individual explanation under Explain. Complete the assigned reading check in the interactive reader.',size=9.5,gap=0)

if __name__ == '__main__':
    import sys
    if '--today' in sys.argv:
        packet=Packet(next(m for m in MEETINGS if m['project']==2 and m['day']==1))
        building(packet)
        packet.finish()
    else:
        from meetings import build_course
        build_course(Packet, building, MEETINGS, OUT, CHAPTERS)
