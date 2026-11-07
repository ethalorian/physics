"""The same value-and-task emphasis used by online prompts and teaching decks."""
import json,re
from pathlib import Path
RULES=json.loads((Path(__file__).resolve().parents[2]/'src/lib/assignment-emphasis-rules.json').read_text())
PATTERNS=[re.compile(x['source'],(re.I if 'i' in x['flags'] else 0)|re.ASCII) for x in RULES['patterns']]
PROTECTED=re.compile(RULES['protectedMarkup'],re.I)
DIRECTIONS=re.compile(RULES['directionPattern'],re.I|re.ASCII)
DIRECTION_PROTECTED=re.compile(RULES['directionProtectedMarkup'],re.I)

def decorate_directions(text):
    def decorate(s):return DIRECTIONS.sub(lambda m:'<i><u>'+m[0]+'</u></i>',s)
    at=0;out=''
    for m in DIRECTION_PROTECTED.finditer(text):
        out+=decorate(text[at:m.start()])+m[0];at=m.end()
    return out+decorate(text[at:])

def runs(text):
    ranges=[]
    for pattern in PATTERNS:
        for m in pattern.finditer(text):
            start,end=m.span()
            if m[0].isdigit() and re.search(r'(?:^|\n)\s*$',text[:start]) and re.match(r'[.)]\s',text[end:]):continue
            ranges.append((start,end))
    ranges.sort(key=lambda r:(r[0],-r[1]));merged=[]
    for start,end in ranges:
        if merged and start<=merged[-1][1]:merged[-1]=(merged[-1][0],max(merged[-1][1],end))
        else:merged.append((start,end))
    out=[];at=0
    for start,end in merged:
        if start>at:out.append((text[at:start],False))
        out.append((text[start:end],True));at=end
    if at<len(text):out.append((text[at:],False))
    return out

def emphasize(text):
    def decorate(s):return ''.join('<b>'+t+'</b>' if bold else t for t,bold in runs(s))
    at=0;out=''
    for m in PROTECTED.finditer(str(text)):
        out+=decorate(text[at:m.start()])+m[0];at=m.end()
    return decorate_directions(out+decorate(text[at:]))
