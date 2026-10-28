// Package the reviewed Claude export. Its runtime and slide logic remain unchanged.
// Run from the repository root; an optional argument selects another reviewed export.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), p5 = require('parse5');
const source = process.argv[2] || 'resources/foundations/day-one/original/Day 1 Briefing.dc.html';
const sourceDir = path.dirname(source), dest = 'public/foundations/day-1-runtime-v1';
const original = fs.readFileSync(source, 'utf8');
const read = file => fs.readFileSync(path.join(sourceDir, file), 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const script = code => `<script>${code.replace(/<\/script/gi, '<\\/script')}</script>`;
const briefing = 'In this fictional classroom scenario, an object has been detected approaching Earth. That statement alone does not tell us whether it will collide. To investigate, we would record where it is, compare measurements at later times, and use a model to predict a future position. A prediction can change when new evidence arrives. This is a teaching case, not a NASA alert.';
const sections = [...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if (sections.length !== 29 || sections.slice(26).some(m => !m[0].includes('data-deck-skip'))) throw Error('Unexpected source slide structure');
let html = original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, section => section.includes('data-deck-skip') ? '' : section);
html = html.replace(/ data-speaker-notes="[^"]*"/g, '')
  .replaceAll('/ 29', '/ 26')
  .replace('[ Paste the NASA Day 1 Briefing text here. ]', briefing)
  .replace('Seven units · seven questions', 'Eight units · eight questions')
  .replace('data-label="Seven units"', 'data-label="Eight units"');
html = require('../foundation-groups/slide-copy.cjs')(html);
const plain= node => {
  if (node.nodeName === '#text') return node.value.replace(/\{\{[^}]+\}\}/g, '');
  if (['button', 'script', 'style'].includes(node.tagName)) return '';
  // Self-check answers stay in their reveal controls, not the companion.
  if (node.tagName === 'sc-if' && node.attrs.some(a => /q\dOpen/.test(a.value))) return '';
  if (node.tagName === 'img') return node.attrs.find(a => a.name === 'alt')?.value || '';
  return (node.childNodes || []).map(plain).join(' ');
};
const slides = [...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m, i) => ({
  number: i + 1, title: m[1].match(/data-label="([^"]+)"/)[1],
  text: plain(p5.parseFragment(m[0])).replace(/\s+/g, ' ').trim(),
}));
const vendor = 'resources/foundations/day-one/vendor';
const libraries = [
  ['react.production.min.js', 'DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],
  ['react-dom.production.min.js', 'gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1'],
].map(([file, integrity]) => {
  const bytes = fs.readFileSync(path.join(vendor, file));
  if (crypto.createHash('sha384').update(bytes).digest('base64') !== integrity) throw Error('Runtime integrity mismatch: ' + file);
  return script(bytes.toString());
}).join('\n');
// Use the export's bundled-resource mechanism to load its unchanged module
// without fetches from the opaque-origin sandbox or external CDN scripts.
const setup = script(`window.__resources = {}; window.__resourceBlobs = {"./deck-stage.js": new Blob([${JSON.stringify(read('deck-stage.js'))}], {type:"text/javascript"})};`);
const bridge = fs.readFileSync('scripts/day-one/slides-bridge.js', 'utf8');
const transition = fs.readFileSync('resources/foundations/day-one/slides-transition.css', 'utf8');
html = html.replace('<script src="./support.js"></script>', () => libraries + setup + script(bridge) + script(read('support.js')))
  .replace('<html>', '<html lang="en">')
  .replace('</head>', `<style data-lesson-transition>${transition}</style></head>`)
  .replace('<head>', `<head><title>Day 1 · The Briefing</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// The original renderer splits inline style declarations on semicolons, so a
// data URL loses its base64 payload. Preserve the original relative asset URL.
fs.mkdirSync(dest + '/art', {recursive: true});
fs.copyFileSync(path.join(sourceDir, 'art/asteroid-briefing.png'), dest + '/art/asteroid-briefing.png');
fs.writeFileSync(dest + '/day-1.dc.html', html);
fs.copyFileSync(vendor + '/LICENSE-react.txt', dest + '/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-one-slides.json', JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-one-source.json', JSON.stringify({
  collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing', file: path.basename(source), sourceSha256: hash(original),
  runtimeSha256: {support: hash(read('support.js')), stage: hash(read('deck-stage.js'))},
  packagedSha256: hash(html), studentSlides: 26, teacherSlidesExcluded: 3,
  cover: {file: 'art/asteroid-briefing.png', sha256: hash(fs.readFileSync(dest + '/art/asteroid-briefing.png'))},
  adaptedSlides: [9, 20],
  transition: {type: 'fade', durationMs: 260, respectsReducedMotion: true},
  notes: 'Original slide markup, artwork, four timers, four answer reveals, support.js, deck-stage.js, and inline logic retained. Student copy excludes teacher-only slides and speaker notes; fills the approved handout from source facts, corrects the eight-unit heading, and renumbers 26 slides. Editor rail hidden. Original export archived unchanged. Runtime libraries pinned and integrity-checked, bundled locally. Original cover PNG is copied unchanged as a separate asset to preserve the export’s CSS parsing. Sandbox permits scripts only; no application storage or network API access. Navigation uses an event-driven bridge. Fonts may load once from Google Fonts. Student submissions, collaboration, mastery and grades remain in the app.',
}, null, 2));
console.log('Packaged 26 interactive slides with unchanged original runtime and logic.');
