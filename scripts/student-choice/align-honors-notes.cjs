// Match the labels on the approved Honors pages to the corresponding CPA notes.
// Usage: node scripts/student-choice/align-honors-notes.cjs <output-directory>
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const parse5 = require('parse5');

const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'public/student-choice-pages/unit-1/layout-1215defe2f22');
const output = process.argv[2];
assert(output, 'Provide a dedicated output directory.');
fs.mkdirSync(output, { recursive: true });

const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const descendants = node => [node, ...(node.childNodes || []).flatMap(descendants)];
const sectionPattern = /<section\b[\s\S]*?<\/section>/;

// Embed the actual bold math faces so this box also prints with its intended weight.
function mathFace(family, file, style) {
  const bytes = fs.readFileSync(path.join(root, 'node_modules/katex/dist/fonts', file));
  return `@font-face{font-family:${family};font-style:${style};font-weight:700;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2')}`;
}
const equationStyle = `<style>${mathFace('ChoiceEquation', 'KaTeX_Main-Bold.woff2', 'normal')}${mathFace('ChoiceVariable', 'KaTeX_Math-BoldItalic.woff2', 'italic')}
.uam-reference{width:100%;border:1.5px solid #252525;border-collapse:collapse;background:#f7f7f7}.uam-reference th,.uam-reference td{padding:4px 6px;text-align:left;border-bottom:1px solid #d6d6d6}.uam-reference th{font:600 11px 'IBM Plex Mono',monospace}.uam-reference td{font-size:14px}.uam-reference strong{font:700 16px/1.3 ChoiceEquation,serif;white-space:nowrap}.uam-reference var{font-family:ChoiceVariable,serif;font-style:italic}.uam-reference sub,.uam-reference sup{font-size:.73em;line-height:0}</style>`;
function addEquationReference(column, heading) {
  const vi = '<var>v</var><sub>i</sub>', vf = '<var>v</var><sub>f</sub>';
  const x = 'Δ<var>x</var>', a = '<var>a</var>', t = '<var>t</var>';
  const rows = [[`${vf} = ${vi} + ${a}${t}`, 'displacement'], [`${x} = ${vi}${t} + ½${a}${t}<sup>2</sup>`, 'final velocity'], [`${vf}<sup>2</sup> = ${vi}<sup>2</sup> + 2${a}${x}`, 'time'], [`${x} = ½(${vi} + ${vf})${t}`, 'acceleration']];
  const html = '<table class="uam-reference"><thead><tr><th>Equation</th><th>Omits</th></tr></thead><tbody>' + rows.map(([formula, cue]) => `<tr><td><strong>${formula}</strong></td><td>${cue}</td></tr>`).join('') + '</tbody></table><div style="font-size:14px;line-height:1.2">Use for motion along one axis with constant acceleration.</div>';
  column.childNodes = [heading, ...parse5.parseFragment(html).childNodes];
  column.childNodes.forEach(node => { node.parentNode = column; });
}

function labels(tree) {
  const found = new Map();
  for (const node of descendants(tree)) {
    const style = node.attrs?.find(a => a.name === 'style');
    if (node.tagName !== 'div' || !style?.value.startsWith('font:')) continue;
    const label = text(node).trim();
    const role = label.match(/^(LEARNING TARGET|[A-E](?= · )|GIVEN$|EQUATION$|WORK$|ANSWER$|DAY(?= \d+ OF 22))/)?.[1];
    if (role) {
      assert(!found.has(role), `Duplicate label ${role}`);
      found.set(role, { node, style, label });
    }
  }
  assert.equal(found.size, 11);
  return found;
}

const sections = [];
let wrapper;
for (let day = 1; day <= 22; day++) {
  const stem = `day-${String(day).padStart(2, '0')}`;
  const cpa = fs.readFileSync(path.join(source, `${stem}-cpa-notes.html`), 'utf8');
  const honors = fs.readFileSync(path.join(source, `${stem}-honors-notes.html`), 'utf8');
  const sourceSection = honors.match(sectionPattern)[0];
  const tree = parse5.parseFragment(sourceSection);
  const before = text(tree);
  const reference = labels(parse5.parseFragment(cpa.match(sectionPattern)[0]));
  const current = labels(tree);
  let expected = before;
  for (const [role, target] of current) {
    const sample = reference.get(role);
    const font = sample.style.value.split(';')[0];
    target.style.value = target.style.value.replace(/^font:[^;]*/, font);
    if (role === 'LEARNING TARGET') {
      // A curriculum code (for example R9) uses the label font throughout.
      assert(target.label === sample.label || (day <= 3 && target.label === 'LEARNING TARGET'));
      expected = expected.replace(target.label, sample.label);
      target.node.childNodes = [{ nodeName: '#text', value: sample.label, parentNode: target.node }];
    }
  }
  assert.equal(text(tree), expected, `Unexpected lesson text change on day ${day}`);
  if (day === 8) {
    const heading = current.get('B').node;
    addEquationReference(heading.parentNode, heading);
  }
  const section = parse5.serialize(tree);
  const revised = honors.replace(sourceSection, () => section);
  fs.writeFileSync(path.join(output, `${stem}-honors-notes.html`), day === 8 ? revised.replace('</head>', equationStyle + '</head>') : revised);
  sections.push(section);
  if (!wrapper) wrapper = honors.replace(sourceSection, '<!-- paired notes -->');
}
fs.writeFileSync(path.join(output, 'unit-1-honors-notebook.html'), wrapper.replace('<!-- paired notes -->', () => sections.join('\n')).replace('</head>', equationStyle + '</head>').replace(/<title>.*?<\/title>/, '<title>Unit 1 Honors notebook · All 22 days</title>'));
