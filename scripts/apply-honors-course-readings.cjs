/** Add or refresh the Honors OpenStax companion paragraph inside each plan's
 * MATERIALS & READING section. Preserve Hewitt assignments and all lesson content.
 * Run after any Hewitt reading-map update. Respects lesson-system source rule C-2.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const map = require('../src/data/honors-course-plan-readings.json');
const book = require('../src/data/openstax-physics-sections.json');
const sections = new Map(book.sections.map(s => [s.id, s]));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marker = /<p data-honors-openstax="[^"]*">[\s\S]*?<\/p>/g;
let count = 0;
for (let unit = 1; unit <= 8; unit++) {
  const file = path.join(root, `src/data/unit${unit}-cpa-lesson-plans.json`);
  const plans = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const day of plans) {
    const key = `${unit}/${day.day}`, reading = map.assignments[key];
    if (!reading) throw Error(`Missing Honors reading for ${key}`);
    const links = reading.selections.map(selection => {
      const section = sections.get(selection.section);
      if (!section || selection.from < section.printedPage || selection.to > section.lastPrintedPage || selection.to < selection.from) throw Error(`Invalid section/pages for ${key}`);
      return `<a href="https://www.antocciphysics.com/textbook/honors?page=${selection.from}">§${section.id} ${escapeHtml(section.title)}</a> (pp. ${selection.from}–${selection.to})`;
    }).join('; ');
    const body = reading.mode === 'assessment' ? escapeHtml(reading.focus) : `Alongside the Honors Hewitt assignment above, ${reading.mode === 'review' ? 'revisit' : 'read'} ${links}. <strong>Focus:</strong> ${escapeHtml(reading.focus)} <em>Page numbers are printed book pages; read only the named section or excerpt on shared pages.</em>`;
    const paragraph = `<p data-honors-openstax="${key}"><strong>Honors companion reading — OpenStax ${escapeHtml(map.title)}:</strong> ${body}</p>`;
    const html = day.bodyHtml.replace(marker, '');
    const heading = html.indexOf('MATERIALS &amp; READING');
    const end = heading < 0 ? -1 : html.indexOf('</td>', heading);
    if (end < 0) throw Error(`Missing materials/reading cell for ${key}`);
    if (!html.slice(heading, end).includes('Hewitt reading:')) throw Error(`Missing Hewitt assignment for ${key}`);
    day.bodyHtml = html.slice(0, end) + paragraph + html.slice(end);
    count++;
  }
  fs.writeFileSync(file, JSON.stringify(plans, null, 2) + '\n');
}
console.log(`Updated ${count} Honors reading sections; existing Hewitt assignments retained.`);
