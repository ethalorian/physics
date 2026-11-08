// Apply to the reviewed daily note HTML and the matching complete notebook.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const [source, course, output] = process.argv.slice(2);
assert(source && ['honors', 'cpa'].includes(course) && output,
  'Usage: node style-note-sections.cjs <source-directory> <cpa|honors> <output-directory>');
const css = fs.readFileSync(path.resolve(__dirname, '../../resources/student-choice/note-section-headings.css'), 'utf8');
const original = /<div style="font:[^"]*">([A-E]) · ([^<>]+)<\/div>/g;
const existingStyle = /<style id="note-section-styles">[\s\S]*?<\/style>/;
fs.mkdirSync(output, { recursive: true });

function styleSheet(section) {
  const revised = section.replace(original, (_, letter, title) =>
    `<h2 class="note-section-heading" data-section="${letter}"><span class="note-section-tab">SECTION ${letter}</span> <span>${title}</span></h2>`);
  const labels = Array.from(revised.matchAll(/class="note-section-heading" data-section="([A-E])"/g), match => match[1]);
  assert.deepEqual(labels, ['A', 'B', 'C', 'D', 'E'], 'Each note sheet must have one heading for every reading reference.');
  const day = Number(revised.match(/^<section\b[^>]*\bid="day-(\d+)"/)?.[1]);
  assert(day >= 1 && day <= 22, 'Expected a Unit 1 day identifier.');
  if ((day === 3 || (course === 'honors' && day === 8)) && !revised.includes('data-section-spacing="compact"')) {
    return revised.replace('<section ', '<section data-section-spacing="compact" ');
  }
  return revised;
}

const names = Array.from({ length: 22 }, (_, i) => `day-${String(i + 1).padStart(2, '0')}-${course}-notes.html`);
names.push(`unit-1-${course}-notebook.html`);
for (const name of names) {
  const input = fs.readFileSync(path.join(source, name), 'utf8');
  const sections = input.match(/<section\b[\s\S]*?<\/section>/g);
  assert.equal(sections.length, name.startsWith('unit-') ? 22 : 1);
  const style = `<style id="note-section-styles">\n${css}</style>`;
  const html = input.replace(existingStyle, '').replace('</head>', () => style + '</head>')
    .replace(/<section\b[\s\S]*?<\/section>/g, styleSheet);
  fs.writeFileSync(path.join(output, name), html);
}
