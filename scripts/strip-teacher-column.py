#!/usr/bin/env python3
"""
Turn Conceptual Physics TEACHER-edition chapter PDFs (cpteNN.pdf) into
student-edition chapters (cpNN.pdf) by removing the teacher column.

Layout fact this relies on (verified across all 39 chapters / 808 pages):
every TE page is 756 x 720 pt = the 567 x 720 student page plus a 189-pt
teacher column on the OUTSIDE edge — left on odd PDF pages, right on even.
The column holds Teaching Tips, Concept Check answers, Teaching Resources
and "Paul" notes; the student page (incl. think!/Assess/Review) is untouched.

The column is REDACTED (text/images/graphics removed from the content
stream), not merely hidden by a crop box, then the page is cropped to 567 x 720.

Usage:
  pip install pymupdf
  python3 scripts/strip-teacher-column.py "<folder of cpteNN.pdf>" ["<out folder>"]
Default out folder: <folder>/student-edition
"""
import glob, os, subprocess, sys
import pymupdf

COL = 189
SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(SRC, 'student-edition')
os.makedirs(OUT, exist_ok=True)
TEACHER_PHRASES = ['teaching tip', 'teaching resources', 'ask students', 'tell students', 'next-time question']

for src in sorted(glob.glob(os.path.join(SRC, 'cpte*.pdf'))):
    n = os.path.basename(src)[4:6]
    dst = os.path.join(OUT, f'cp{n}.pdf')
    d = pymupdf.open(src)
    for i, pg in enumerate(d):
        W, H = pg.rect.width, pg.rect.height
        assert (round(W), round(H)) == (756, 720), f'{src} p{i+1}: unexpected page size {W}x{H}'
        rect = pymupdf.Rect(0, 0, COL, H) if i % 2 == 0 else pymupdf.Rect(W - COL, 0, W, H)
        pg.add_redact_annot(rect, fill=(1, 1, 1))
        pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_PIXELS, graphics=1)
        cb = pg.cropbox
        keep = pymupdf.Rect(cb.x0 + COL, cb.y0, cb.x1, cb.y1) if i % 2 == 0 else pymupdf.Rect(cb.x0, cb.y0, cb.x1 - COL, cb.y1)
        pg.set_cropbox(keep)
    d.save(dst, garbage=4, deflate=True)
    d.close()
    # sanity: no teacher phrases survive in the text layer
    try:
        txt = subprocess.run(['pdftotext', dst, '-'], capture_output=True, text=True).stdout.lower()
        leaks = sum(txt.count(k) for k in TEACHER_PHRASES)
    except FileNotFoundError:
        leaks = -1  # pdftotext not installed; skip the check
    print(f"{os.path.basename(src)} -> {os.path.basename(dst)}  leaks={leaks}")
print('done ->', OUT)
