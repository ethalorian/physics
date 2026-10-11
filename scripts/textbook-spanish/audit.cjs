// Local-only integrity and editorial-coverage gate. Never calls a model API.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const work = process.argv[2];
if (!work) throw new Error('Pass the translation work directory');
const strict = process.argv.includes('--strict');
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const numbers = s => (s.match(/\d+(?:[.,]\d+)*/g) || []).sort().join('|');
const glyphs = s => (s.match(/\[GLYPH_[A-Z]+\]/g) || []).sort().join('|');
const report = { pages: 0, translated: 0, reviewed: 0, labels: 0, errors: [], attention: [], chapters: [] };
for (const file of fs.readdirSync(work).filter(f => f.endsWith('.source.json')).sort()) {
  const source = JSON.parse(fs.readFileSync(path.join(work, file)));
  const chapter = { chapter: source.chapter, pages: source.pages.length, translated: 0, reviewed: 0, labels: 0 };
  for (const p of source.pages) {
    report.pages++;
    const base = `cp${String(source.chapter).padStart(2, '0')}.p${String(p.page).padStart(3, '0')}`;
    const error = message => report.errors.push({ page: base, message });
    const esFile = path.join(work, base + '.es.json');
    if (!fs.existsSync(esFile)) { error('Missing translation'); continue; }
    const es = JSON.parse(fs.readFileSync(esFile));
    if (es.contentHash !== p.contentHash || es.sourceHash !== source.sha256) { error('Stale source metadata'); continue; }
    if (Object.keys(es.blocks).sort().join('|') !== p.blocks.map(b => b.id).sort().join('|')) error('Block IDs differ');
    const overridden = new Set();
    for (const [index, override] of (es.layoutOverrides || []).entries()) {
      if (!Array.isArray(override.ids) || !override.ids.length || override.ids.some(id => !Object.hasOwn(es.blocks, id))) error('Invalid layout override IDs');
      else override.ids.forEach(id => overridden.add(id));
      if (typeof override.text !== 'string' || !override.text.trim() || !override.reason) error('Undocumented layout override');
      const box = override.bbox;
      if (!Array.isArray(box) || box.length !== 4 || box.some(n => !Number.isFinite(n)) || box[0] < 0 || box[1] < 0 || box[2] > p.width || box[3] > p.height || box[2] <= box[0] || box[3] <= box[1]) error('Invalid override geometry');
      else for (const previous of es.layoutOverrides.slice(0, index)) {
        if (override.ids.some(id => previous.ids.includes(id)) && Math.min(box[2], previous.bbox[2]) - Math.max(box[0], previous.bbox[0]) > 1 && Math.min(box[3], previous.bbox[3]) - Math.max(box[1], previous.bbox[1]) > 1) error('Overlapping replacements for the same source text');
      }
    }
    for (const b of p.blocks) {
      const text = es.blocks[b.id];
      if (typeof text !== 'string' || !text.trim()) { error(`Empty block ${b.id}`); continue; }
      if (numbers(text) !== numbers(b.text)) error(`Numbers differ in block ${b.id}`);
      if (glyphs(text) !== glyphs(b.text)) error(`Protected symbols differ in block ${b.id}`);
      for (const [token, translated] of Object.entries(es.glyphTranslations?.[b.id] || {})) {
        const original = b.glyphs?.[token]?.text;
        if (!original || !translated.trim()) error(`Invalid verbal glyph ${b.id}/${token}`);
        else if (numbers(original) !== numbers(translated)) error(`Verbal glyph numbers differ ${b.id}/${token}`);
      }
      if (strict && !overridden.has(b.id)) for (const [token, glyph] of Object.entries(b.glyphs || {})) {
        if (/[A-Za-z]{3}/.test(glyph.text) && !/^\s*RPM\.?\s*$/.test(glyph.text) && !es.glyphTranslations?.[b.id]?.[token]) error(`Untranslated verbal glyph ${b.id}/${token}`);
      }
    }
    report.translated++; chapter.translated++;
    const reviewFile = path.join(work, base + '.review.json');
    if (fs.existsSync(reviewFile)) {
      const review = JSON.parse(fs.readFileSync(reviewFile));
      if (strict && review.model !== 'gpt-6.1-sol (Codex)') error('Missing Codex Sol review');
      if (review.translationHash === hash(es.blocks)) {
        report.reviewed++; chapter.reviewed++;
        if (review.needsAttention) report.attention.push({ page: base, notes: review.notes });
      } else if (strict) error('Editorial review predates current translation');
    } else if (strict) error('Missing bilingual editorial review');
    const labelFile = path.join(work, base + '.labels.es.json');
    if (fs.existsSync(labelFile)) {
      const labels = JSON.parse(fs.readFileSync(labelFile)).labels;
      if (!Array.isArray(labels) || labels.some(x => typeof x.english !== 'string' || !x.english.trim() || typeof x.spanish !== 'string' || !x.spanish.trim())) error('Malformed diagram-label translations');
      else { report.labels++; chapter.labels++; }
    } else if (strict) error('Missing illustration review');
  }
  report.chapters.push(chapter);
}
fs.writeFileSync(path.join(work, 'integrity-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, chapters: undefined, errors: report.errors.slice(0, 30), attention: report.attention }, null, 2));
if (strict && (report.errors.length || report.attention.length || report.translated !== report.pages || report.reviewed !== report.pages || report.labels !== report.pages)) process.exitCode = 1;
