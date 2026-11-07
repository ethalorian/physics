"""Layout for individual response sheets, combined project booklets and the print shelf."""
import html
import json
from pathlib import Path
from pypdf import PdfReader, PdfWriter

SPECS = json.loads(Path(__file__).with_name('activities.json').read_text())
PATENT = 'https://www.sciencetoymaker.org/wp-content/uploads/2017/03/Pattent-Piot1891.pdf'
TITLES = ['Organizer design', 'Mixed-use building', 'Patented boat', 'Electricity and communication']


def link(p, label, url):
    p.label(44,p.y,label,'Helvetica-Bold',10,'#253f47')
    p.c.linkURL(url,(44,p.y-3,44+p.c.stringWidth(label,'Helvetica-Bold',10),p.y+11),relative=0)
    p.y-=20


def pages(c):
    return {2:'12-14',10:'83-87'}.get(c['number'],f"{c['from']}-{c['to']}")


def standard(p, chapters):
    m=p.m
    spec=SPECS[f"{m['project']}.{m['day']}"]
    task = 'Task '+m['task'] if m['task'][0].isdigit() else m['task']
    p.start(task+'   /   Prepare and draw',spec['topic'])
    p.head(1,'Set up the investigation')
    p.para(spec['ref'])
    if (m['project'],m['day'])==(3,1):
        link(p,'Open Piot’s original patent and figure (also linked in the lesson)',PATENT)
    p.para(m['measure'])
    headers, rows=spec['tables'][0]
    p.table(headers,rows,max(25,min(34,int(136/len(rows)))))
    p.head(2,'Plan it on paper')
    p.para(m['plan'])
    p.grid(max(78, min(230, int(p.y-128))))
    p.para('My prediction, chosen feature or design limit',size=10,bold=True,gap=0)
    p.lines(2)

    p.start(task+'   /   Test, compare and explain',spec['topic'])
    p.head(3,'Run the test and record what happened')
    p.para(m['make']+' '+m['test'])
    headers,rows=spec['tables'][1]
    p.table(headers,rows,max(26,min(43,int(157/len(rows)))))
    p.head(4,'Use the reading')
    choices=[chapters[n] for n in m['chapters']]
    for c in choices:
        p.para(f"Ch. {c['number']}  |  {c['title']}  |  printed pp. {pages(c)}",size=10,bold=True,gap=1)
    p.para('Complete the assigned checks in the interactive reader. Here, identify a page and one idea that helps explain your result or design decision.',size=10,gap=1)
    p.lines(2)
    p.head(5,'Individual explanation')
    p.para(m['exit'])
    p.lines(max(2,min(6,int((p.y-57)/19))))
    p.para('Keep these sheets with the work. Save the individual explanation in the lesson’s Explain step.',size=9,gap=0)


def print_index(out, groups):
    sections=[]
    for project,items in groups.items():
        links=''.join(f'<li><a href="{filename}">{html.escape(label)}</a><small>{count} pages</small></li>' for label,filename,count in items)
        total=sum(count for _,_,count in items)
        sections.append(f'<section><p class="over">PROJECT {project}</p><h2>{TITLES[project-1]}</h2><p><a class="book" href="project-{project}.pdf">Print the project booklet</a> · {total} pages</p><ol>{links}</ol></section>')
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student print packets · MVP Engineering</title><style>
*{box-sizing:border-box}body{margin:auto;background:#fcfbf6;color:#193337;font:1rem/1.55 system-ui,sans-serif;max-width:74rem;padding:2rem clamp(1rem,4vw,4rem)}h1,h2{line-height:1.13}h1{font-size:clamp(2.2rem,6vw,4rem);margin:.2em 0}h2{font-size:1.55rem;margin:.4em 0}.over{font-size:.8rem;font-weight:750;letter-spacing:.11em;color:#446369}header{max-width:50rem}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,25rem),1fr));gap:1.2rem;margin-top:2rem}section{border:1px solid #bdc8c4;border-radius:.6rem;padding:1.3rem;background:white}a{color:#07575d;text-underline-offset:.16em}a:focus-visible{outline:3px solid #a25a05;outline-offset:3px}.book{font-weight:680}ol{padding-left:1.5rem}li{margin:.55rem 0;padding-left:.2rem}small{display:block;color:#4e6265}footer{margin:2rem 0}@media print{body{background:white;padding:0}main{display:block}section{break-inside:avoid}}
</style><header><p class="over">MVP ENGINEERING  /  ENGINEERING THE FUTURE</p><h1>Student print packets</h1><p>Print one meeting for each student or choose a whole project. Each packet has room for sketches, measurements, test results and an individual explanation. Open the assigned reading in the classroom app.</p><a class="book" href="project-2-meeting-01.pdf">Start Project 2 · Print Task 2.1</a></header><main>'''+''.join(sections)+'</main><footer>MVP Engineering · Classroom field notes · US Letter</footer></html>'
    (out/'index.html').write_text(page)


def build_course(Packet,building,meetings,out,chapters):
    groups={}
    for m in meetings:
        p=Packet(m)
        if m['project']==2 and m['day']==1:
            building(p)
        else:
            standard(p,chapters)
        p.finish()
        length=len(PdfReader(p.path).pages)
        groups.setdefault(m['project'],[]).append((m['task']+' · '+m['title'],p.path.name,length))
    for project,items in groups.items():
        joined=PdfWriter()
        for label,filename,_ in items:
            joined.append(out/filename,outline_item=label)
        joined.add_metadata({'/Title':f"MVP Engineering | Project {project} | {TITLES[project-1]}",'/Author':'MVP Engineering'})
        with (out/f'project-{project}.pdf').open('wb') as stream:
            joined.write(stream)
        joined.close()
    print_index(out,groups)
    print(', '.join(f'Project {p}: {len(items)} meetings, {sum(n for _,_,n in items)} pages' for p,items in groups.items()))
