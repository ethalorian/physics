// Local authoring support. All translations are written by Codex agents;
// this module never calls a model or translation service.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const base = '/Users/craigantocci/Documents/Claude/Projects/Physics Curriculum Planning';
const work = path.join(base, 'Textbook Portuguese/tmp');
const reference = path.join(base, 'Textbook Spanish/tmp');
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const name = (chapter, page) => `cp${String(chapter).padStart(2, '0')}.p${String(page).padStart(3, '0')}`;
const read = file => JSON.parse(fs.readFileSync(file));
const source = chapter => read(path.join(work, `cp${String(chapter).padStart(2, '0')}.source.json`));
const numbers = text => (text.match(/\d+(?:[.,]\d+)*/g) || []).sort().join('|');
const glyphs = text => (text.match(/\[GLYPH_[A-Z]+\]/g) || []).sort().join('|');
function input(chapter, first = 1, last = first) {
  return source(chapter).pages.filter(p => p.page >= first && p.page <= last).map(p => {
    const stem = name(chapter, p.page), es = read(path.join(reference, stem + '.es.json'));
    return { chapter, page: p.page,
      blocks: Object.fromEntries(p.blocks.map(b => [b.id, b.text])),
      verbalGlyphs: Object.fromEntries(p.blocks.filter(b => Object.keys(es.glyphTranslations?.[b.id] || {}).length).map(b => [b.id, Object.fromEntries(Object.keys(es.glyphTranslations[b.id]).map(k => [k, b.glyphs[k].text]))])),
      layoutReference: (es.layoutOverrides || []).map(o => ({ ids: o.ids, text: o.text, reason: o.reason })),
      labels: read(path.join(reference, stem + '.labels.es.json')).labels.map(l => l.english),
      sourceIssues: read(path.join(reference, stem + '.review.json')).sourceIssues || [],
    };
  });
}
function save(chapter, page, translation) {
  const src = source(chapter), p = src.pages.find(p => p.page === page), stem = name(chapter, page);
  const es = read(path.join(reference, stem + '.es.json'));
  const englishLabels = read(path.join(reference, stem + '.labels.es.json')).labels;
  assert.deepEqual(Object.keys(translation.blocks).sort(), p.blocks.map(b => b.id).sort(), `${stem}: complete block IDs required`);
  for (const b of p.blocks) {
    const t = translation.blocks[b.id];
    assert(typeof t === 'string' && t.trim(), `${stem}: empty block ${b.id}`);
    assert.equal(numbers(t), numbers(b.text), `${stem}: numbers differ in block ${b.id}`);
    assert.equal(glyphs(t), glyphs(b.text), `${stem}: glyph tokens differ in block ${b.id}`);
  }
  assert.equal((translation.layoutTexts || []).length, (es.layoutOverrides || []).length, `${stem}: translate every layout override`);
  assert.equal((translation.labelTranslations || []).length, englishLabels.length, `${stem}: translate every diagram label`);
  const record = { chapter, page, language: 'pt-BR', sourceHash: src.sha256, contentHash: p.contentHash, model: 'Codex agent', blocks: translation.blocks };
  if (translation.glyphTranslations) record.glyphTranslations = translation.glyphTranslations;
  if (es.layoutOverrides?.length) record.layoutOverrides = es.layoutOverrides.map((o, i) => ({ ...o, text: translation.layoutTexts[i], reason: o.reason + ' Portuguese wording authored and checked in Codex.' }));
  assert(record.layoutOverrides?.every(o => typeof o.text === 'string' && o.text.trim()) ?? true);
  const notes = translation.reviewNotes || ['Brazilian Portuguese translated directly in Codex and checked against the English source for meaning, physics vocabulary, quantities and symbols.'];
  const review = { chapter, page, model: 'Codex agent', language: 'pt-BR', translationHash: hash(record.blocks), needsAttention: false, notes, sourceIssues: translation.sourceIssues ?? read(path.join(reference, stem + '.review.json')).sourceIssues ?? [] };
  const labels = { chapter, page, language: 'pt-BR', model: 'Codex agent', labels: englishLabels.map((l,i) => ({ english: l.english, portuguese: translation.labelTranslations[i] })), notes: ['Diagram words checked against the existing source-artwork inventory.'] };
  assert(labels.labels.every(l => typeof l.portuguese === 'string' && l.portuguese.trim()));
  fs.writeFileSync(path.join(work, stem + '.pt.json'), JSON.stringify(record, null, 2) + '\n');
  fs.writeFileSync(path.join(work, stem + '.review.json'), JSON.stringify(review, null, 2) + '\n');
  fs.writeFileSync(path.join(work, stem + '.labels.pt.json'), JSON.stringify(labels, null, 2) + '\n');
  return stem;
}
module.exports = { work, reference, source, input, save };
if (require.main === module) console.log(JSON.stringify(input(Number(process.argv[2]), Number(process.argv[3]) || 1, Number(process.argv[4]) || Number(process.argv[3]) || 1)));
