import sys,json
from pathlib import Path
import pymupdf as fitz
work=Path(sys.argv[1])
for file in sorted(work.glob('*.source.json')):
    source=json.loads(file.read_text());doc=fitz.open(source['source'])
    for page in doc:
        dest=work/f'cp{source["chapter"]:02}.p{page.number+1:03}.source.jpg'
        if not dest.exists():page.get_pixmap(matrix=fitz.Matrix(1.8,1.8)).save(str(dest),jpg_quality=90)
    print('IMAGES',source['chapter'],flush=True)
