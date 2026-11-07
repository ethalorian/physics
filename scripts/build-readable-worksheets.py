"""Revised wording in Craig's original compact two-column worksheet layout.

No ruled text-response lines. Original headers, typography, vector diagrams and
self-checks remain. Source questions and optional sentence starters are read only.
Requires reportlab and pypdf; no raster-figure preparation is needed for print.
"""
import argparse,copy,json,sys,zipfile
from pathlib import Path
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'scripts/worksheet-print'))
import compact as r
import pilot_diagrams,course_diagrams
from glossary import terms,GLOSSARY
from emphasis import emphasize
pilot_diagrams.install(r);course_diagrams.install(r)
base_parts=r.parts
class Edition(r.Compact):
 def __init__(self,path,day,track,sei=False):
  self.sei=sei;super().__init__(path,day,track)
 def track_label(self):return self.track.upper()+(' + SEI' if self.sei else '')
 def first_height(self):
  z=super().first_height()
  if not self.sei:return z
  a,b,*_=terms(self.d['unit'],self.d['day'])
  z['languageTop']=z['end']+5
  z['languageText']=f'<b>LANGUAGE GOAL</b> Use “{a}” and “{b}” to explain your answer. Sentence starters are optional.'
  z['words']=[f'<b>{t}</b>: {GLOSSARY[t]}' for t in terms(self.d['unit'],self.d['day'])]
  z['languageH']=r.p(z['languageText'],576,8.2,10)[1]
  z['wordH']=max(r.p(t,181,8.2,10)[1] for t in z['words'])
  z['end']=z['languageTop']+z['languageH']+5+z['wordH']+8
  return z
 def start(self,total,first=False):
  top=super().start(total,first)
  if self.sei:
   if first:
    z=self.first_height();y=z['languageTop'];self.para(18,y,576,z['languageText'],8.2,10)
    for i,t in enumerate(z['words']):self.para(18+i*196,y+z['languageH']+5,181,t,8.2,10)
   else:self.para(18,49,375,'Sentence starters are optional. You may plan in any language.',7,8)
  return top

def parts(q):
 blocks=base_parts(q)
 if q.get('sei'):
  if q['sei'].get('meaning'):blocks.append(('<b>Word help:</b> '+q['sei']['meaning'],8.3,10.4,4))
  if q['sei'].get('frame'):blocks.append(('<b>Sentence starter:</b> '+q['sei']['frame'],8.3,10.4,5))
 return [(emphasize(t),size,leading,max(2,gap-q.get('_printGapReduction',0))) for t,size,leading,gap in blocks]
r.parts=parts

def main():
 parser=argparse.ArgumentParser();parser.add_argument('cache',nargs='?',default=str(ROOT/'.worksheet-print-cache'));parser.add_argument('--unit',type=int);parser.add_argument('--day',type=int);parser.add_argument('--edition');args=parser.parse_args()
 cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
 days=json.loads((ROOT/'resources/worksheet-decks/source.json').read_text());supports=json.loads((ROOT/'resources/worksheet-decks/language-supports.json').read_text())
 manifest=json.loads((ROOT/'src/data/daily-worksheets.json').read_text());meta={(d['unit'],d['day']):d for d in manifest}
 original=json.loads((ROOT/'resources/worksheet-fonts/original-page-counts.json').read_text());audit=[]
 compact_pages=json.loads((ROOT/'resources/worksheet-fonts/compact-page-counts.json').read_text())
 for source in days:
  if args.unit and source['unit']!=args.unit:continue
  if args.day and source['day']!=args.day:continue
  for edition in ['cpa','cpa-sei','honors','honors-sei']:
   if args.edition and edition!=args.edition:continue
   track=edition.split('-')[0];sei=edition.endswith('-sei');d=copy.deepcopy(source)
   for q in d[track]:
    # Reserve only the original self-check separation; no text-answer padding.
    q['workspace']=8
    q.pop('extraWorkspace',None)
    if sei:q['sei']=supports[f"{d['unit']}-{d['day']}-{track}-{q['number']}"]
   relative=f"/worksheets/unit-{d['unit']}/{edition}/day-{d['day']:02d}.pdf";dest=ROOT/'public'/relative.lstrip('/')
   s=Edition(dest,d,track,sei);top=s.first_height()['end']+9
   found=None
   # Bold glyphs are wider. Preserve the current page budget and font size;
   # only a dense edition may need up to two points less between text blocks.
   for gap_reduction in [0,1,2]:
    for q in d[track]:q['_printGapReduction']=gap_reduction
    heights=[r.min_height(q,track) for q in d[track]]
    for pages in range(2,compact_pages.get(relative,original[relative])+1):
     caps=[r.BOTTOM-top]*2+[r.BOTTOM-66]*(pages*2-2)
     if len(heights)<len(caps):continue
     found=r.partition(heights,caps)
     if found:break
    if found:break
   assert found,(relative,heights)
   _,ends,used=found
   for col in range(pages*2):
    y=s.start(pages,col==0) if col%2==0 else top if col==1 else 66
    x=18 if col%2==0 else 315;count=ends[col+1]-ends[col];extra=(caps[col]-used[col])/count
    for idx in range(ends[col],ends[col+1]):
     h=heights[idx]+extra;r.draw_block(s,d[track][idx],x,y,h);y+=h+12
   s.save();pdf=PdfReader(dest);text='\n'.join(p.extract_text() for p in pdf.pages)
   assert len(pdf.pages)==pages and len(s.checks)==len(d[track])
   assert text.count('Marzano check - circle:')==len(d[track])
   if sei:assert text.count('Sentence starter:')==len(d[track])
   assert not any(c in text for c in ['\ufffd','\x00','**'])
   assert all({x['x'] for x in s.layout if x['page']==p}=={18,315} for p in range(1,pages+1))
   meta[(d['unit'],d['day'])]['files'][edition].update(pages=pages,problems=len(d[track]))
   audit.append({'path':relative,'pages':pages,'originalPages':original[relative],'questions':len(d[track]),'figures':sum(bool(q.get('visual')) for q in d[track]),'columns':s.layout,'textResponseLines':0,'spacingAdjustmentPt':gap_reduction})
  print(f"Restored U{source['unit']} D{source['day']}",flush=True)
 (ROOT/'src/data/daily-worksheets.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
 (cache/'pdf-build-audit.json').write_text(json.dumps(audit,indent=2))
 if not (args.unit or args.day or args.edition):
  for unit in range(1,9):
   for edition in ['cpa','cpa-sei','honors','honors-sei']:
    directory=ROOT/f'public/worksheets/unit-{unit}'
    with zipfile.ZipFile(directory/f'{edition}-worksheets.zip','w',zipfile.ZIP_DEFLATED) as z:
     for p in sorted((directory/edition).glob('day-*.pdf')):z.write(p,f'unit-{unit}-{edition}-{p.name}')
 print(json.dumps({'pdfs':len(audit),'pages':sum(x['pages'] for x in audit),'originalPages':sum(x['originalPages'] for x in audit),'increased':[{k:x[k] for k in ['path','pages','originalPages']} for x in audit if x['pages']>x['originalPages']]}))
if __name__=='__main__':main()
