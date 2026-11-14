# Foundation transfer print pages

The 22 daily CPA/MVP and Honors choice packets use the same Section E graphics as the Foundation projector. SEI packets receive the same task and graphic, with a word bank and optional sentence starters. Each page retains a first call and a revised call. The teacher's new report and discussion answer are never printed in advance.

`export-graphics.cjs` reads the live projector's existing task data and renders `transfer-visuals.js` at phase 0. Print changes are grayscale outline fills, removal of redundant headings, and documented label clearances. Coordinates, force lengths, measured data, and units remain unchanged. It requires React from the project and Playwright (optionally located through `CODEX_NODE_MODULES`). `CHROME_EXECUTABLE` can select a headless Chrome binary.

`build.py` uses ReportLab, pypdf, and pdfplumber. It reads the daily copy in `resources/foundation-transfer-print/prompts.json`, merges vector diagrams, validates Letter bounds and the punch margin, and replaces only the last page of each packet. The first three choice pages and first five SEI pages must have identical PDF content streams. The approved Day 9 regular copies are retained verbatim as source PDFs.

```sh
node scripts/foundation-transfer-print/export-graphics.cjs /path/to/scratch
python3 scripts/foundation-transfer-print/build.py /path/to/scratch /path/to/output
```

Review the four 22-page transfer collections after rendering them to images. Inspect long prompts, graph labels, diagram boundaries, response space, and footer clearance. The output manifest records all 88 packet hashes and preserved-page counts. The original packets are archived in the output directory before rebuilding. Preserve that archive or use a fresh output directory for a new revision.

After review, `--install` writes the daily PDFs to their existing projector print URLs. Publish the four collections separately as `print/{cpa,honors}/transfer-pages.pdf` and `transfer-pages-sei.pdf`. No student assignment IDs, grades, selected choices, notes, readings, Frayer pages, or Section B doodles are modified.

Binder standards: P-1/P-2; G-1/G-2; C-2/C-4/C-8; T-1/T-3; FL-2/FL-3.
