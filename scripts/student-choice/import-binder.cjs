/** Package approved source verbatim. Never run the generator over approved pages. */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../..');
const source = process.argv[2];
if (!source) throw Error('Usage: node scripts/student-choice/import-binder.cjs <original project folder>');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(path.join(source, file), 'utf8');
const sections = html => [...html.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(m => m[0]);
const text = html => html.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&nbsp;', ' ').trim();
const files = [];
function walk(dir, prefix = '') { for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) { const name = prefix + entry.name; if (entry.isDirectory()) walk(path.join(dir, entry.name), name + '/'); else files.push({ file: name, sha256: hash(fs.readFileSync(path.join(dir, entry.name))) }); } }
walk(source);
const version = 'original-' + hash(JSON.stringify(files)).slice(0, 12);
const url = '/student-choice-pages/unit-1/' + version;
const dest = path.join(root, 'public', url);
fs.mkdirSync(path.join(dest, 'fonts'), { recursive: true });
for (const file of ['doc-page.js', 'logo.png', ...fs.readdirSync(path.join(source, 'fonts')).map(f => 'fonts/' + f)]) fs.copyFileSync(path.join(source, file), path.join(dest, file));
const checks = [];
function page(file, section, filename, title, extra = {}) {
  const original = read(file), all = sections(original);
  assert(all.includes(section), 'Only exact original page sections may be packaged');
  // Keep the original styles, fonts, page component and page section. The
  // Claude authoring/editor runtime is unnecessary in a static printable copy.
  const head = original.match(/<helmet>([\s\S]*?)<\/helmet>/)[1];
  const open = original.match(/<doc-page\b[^>]*>/)[0];
  let html = '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + head + '</head><body>' + open + '\n' + section + '\n</doc-page></body></html>';
  const escaped = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  html = html.replace('</head>', `<title>${escaped} · Student Choice</title>\n<style>.binder-tools{padding:12px 20px;display:flex;align-items:center;gap:16px;background:white;color:#171717;font:15px system-ui}.binder-tools button{font:inherit;padding:8px 18px;cursor:pointer}.binder-tools span{line-height:1.4}@media print{.binder-tools{display:none!important}*,*::before,*::after{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>\n</head>`);
  html = html.replace('<body>', '<body>\n<nav class="binder-tools" aria-label="Page printing"><button type="button" onclick="window.print()">Print page</button><span>US Letter · 100% scale · Turn on background graphics</span></nav>');
  assert.equal(sections(html).length, 1);
  assert.equal(sections(html)[0], section, 'Page content, styles and artwork must remain byte-for-byte identical');
  fs.writeFileSync(path.join(dest, filename), html);
  checks.push({ file: filename, source: file, sectionId: section.match(/id="([^"]+)"/)[1], sectionSha256: hash(section), originalSectionIdentical: true });
  return { title, path: url + '/' + filename, sha256: hash(html), ...extra };
}
const notebookFiles = { cpa: 'Unit 1 Notebook Pages v2.dc.html', honors: 'Unit 1 Honors Notebook Pages.dc.html' };
const notes = Object.fromEntries(Object.entries(notebookFiles).map(([edition, file]) => [edition, new Map(sections(read(file)).map(s => [Number(s.match(/id="day-(\d+)"/)[1]), s]))]));
assert.equal(notes.cpa.size, 22); assert.equal(notes.honors.size, 3);
const colorFile = 'Unit 1 Color Code.dc.html';
const reference = page(colorFile, sections(read(colorFile))[0], 'color-code.html', 'Unit 1 color code');
const catalog = [];
for (let day = 1; day <= 22; day++) {
  const dd = String(day).padStart(2, '0'), spec = JSON.parse(read('_gen/specs/d' + dd + '.json'));
  const practiceFile = 'Unit 1 Day ' + dd + ' Practice.dc.html', practice = sections(read(practiceFile));
  assert.equal(practice.length, 6); assert.equal(spec.opts.length, 6);
  const sei = spec.opts.filter(o => ['J', 'K', 'L'].includes(o.st));
  assert.equal(sei.length, 2); assert.equal(new Set(sei.map(o => o.st)).size, 2);
  const title = text(notes.cpa.get(day).match(/font-size:29px[^>]*>([\s\S]*?)<\/div>/)[1]);
  const editions = {};
  for (const [edition, notePages] of Object.entries(notes)) if (notePages.has(day)) {
    const section = notePages.get(day);
    const target = section.match(/LEARNING TARGET[\s\S]*?<\/div>\s*<div[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert(target, 'Learning target must come from the original note');
    editions[edition] = page(notebookFiles[edition], section, `day-${dd}-${edition}-notes.html`, `${edition.toUpperCase()} notebook · Day ${day}`, { target: text(target) });
  }
  const options = practice.map((section,i) => {
    const option = spec.opts[i]; assert.equal(option.n, i+1); assert(section.includes(`OPTION ${i+1} · STYLE ${option.st}`));
    return page(practiceFile, section, `day-${dd}-option-${i+1}.html`, text(option.title), { style: option.st, sei: ['J','K','L'].includes(option.st) });
  });
  catalog.push({ key: 'unit-1-day-' + dd, unit: 'unit-1', day, title, target: editions.cpa.target, version, notes: editions, options, reference });
}
const catalogPath = path.join(root, 'src/data/student-choice-binder.json');
const previous = fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath)) : [];
// Retain pinned older editions for assignments already created against them.
fs.writeFileSync(catalogPath, JSON.stringify([...catalog, ...previous.filter(p => p.version !== version)], null, 2) + '\n');
fs.mkdirSync(path.join(root, 'docs/student-choice'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/student-choice', version + '.json'), JSON.stringify({ version, sourceArtifact: '18e62b3a-7126-40f3-8ea3-7996d7bc4211', sourceFiles: files, pages: checks, cpaDays: 22, honorsDays: [1,2,3], practiceDays: 22, optionsPerDay: 6, seiPerDay: 2, generatedPages: checks.length, packagingOnly: true }, null, 2) + '\n');
console.log(JSON.stringify({ version, pages: checks.length, cpaDays: notes.cpa.size, honorsDays: notes.honors.size, practiceOptions: 132, allPageSectionsIdentical: true }));
