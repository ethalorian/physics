"""Render carousel images from the exact packaged PDFs (pypdfium2 and Pillow)."""
from pathlib import Path
import json
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "src/data"
PUBLIC = ROOT / "public/student-choice-pages"
OUT = PUBLIC / "practice-previews"
OUT.mkdir(parents=True, exist_ok=True)
packets = json.loads((DATA / "student-choice-binder.json").read_text())
files = json.loads((DATA / "student-choice-practice-pdfs.json").read_text())
seen = set()
for packet in packets:
    options = packet["options"]
    if all(o["sha256"] in seen for o in options):
        continue
    filename = files[packet["key"] + "@" + packet["version"]]
    with pdfium.PdfDocument(PUBLIC / "practice-pdfs" / filename) as pdf:
        assert len(pdf) == len(options), filename
        for index, option in enumerate(options):
            key = option["sha256"]
            if key in seen:
                continue
            page = pdf[index]
            try:
                assert tuple(page.get_size()) == (612, 792), filename
                bitmap = page.render(scale=1.5)
                try:
                    image = bitmap.to_pil().convert("L")
                    image.save(OUT / (key + ".webp"), "WEBP", lossless=True, method=4)
                finally:
                    bitmap.close()
            finally:
                page.close()
            seen.add(key)
print(f"Exported {len(seen)} sheet previews for {len(packets)} pinned daily packets.")
