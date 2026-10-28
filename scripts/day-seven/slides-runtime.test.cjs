const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const p5 = require('parse5');
const original = fs.readFileSync('resources/foundations/day-seven/original/Day 7 Acceleration.dc.html', 'utf8');
const packaged = fs.readFileSync('public/foundations/day-7-runtime-v1/day-7.dc.html', 'utf8');
const logic = text => text.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
const all = node => [node, ...(node.childNodes || []).flatMap(all)];
const nodes = all(p5.parse(packaged));
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;

test('export logic is unchanged; all executable scripts remain intact after packaging', () => {
  assert.equal(logic(packaged), logic(original));
  const scripts = nodes.filter(n => n.tagName === 'script' && !attr(n, 'type'));
  assert.equal(scripts.length, 5);
  for (const script of scripts) assert.doesNotThrow(() => new vm.Script(p5.serialize(script)));
  const metadata = JSON.parse(fs.readFileSync('src/data/foundations/day-seven-source.json'));
  assert.equal(crypto.createHash('sha256').update(packaged).digest('hex'), metadata.packagedSha256);
  const support = fs.readFileSync('resources/foundations/day-seven/original/support.js', 'utf8');
  const styleParser = support.slice(support.indexOf('  function kebabToCamel('), support.indexOf('  function compileAttr('));
  const parseStyle = vm.runInNewContext(styleParser + '\ncssToObj;');
  const cover = nodes.find(n => n.tagName === 'section');
  assert.equal(parseStyle(attr(cover, 'style')).backgroundImage, "url('art/asteroid-briefing.png')");
  const coverBytes = fs.readFileSync('public/foundations/day-7-runtime-v1/art/asteroid-briefing.png');
  assert.deepEqual(coverBytes, fs.readFileSync('resources/foundations/day-seven/original/art/asteroid-briefing.png'));
  assert.equal(crypto.createHash('sha256').update(coverBytes).digest('hex'), metadata.cover.sha256);
  const csp = nodes.find(n => attr(n, 'http-equiv') === 'Content-Security-Policy');
  assert.match(attr(csp, 'content'), /img-src 'self'/);
});

test('student copy excludes teacher-only content, retains all controls and contains the four original comic snapshots', () => {
  const sections = nodes.filter(n => n.tagName === 'section');
  assert.equal(sections.length, 30);
  assert.ok(sections.every(n => attr(n, 'data-speaker-notes') === undefined && attr(n, 'data-deck-skip') === undefined));
  const originalStudent = [...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].slice(0, 26).join('');
  const controls = text => [...text.matchAll(/onClick="([^"]*)"/g)].map(m => m[1]);
  assert.deepEqual(controls(packaged), controls(originalStudent));
  assert.equal(sections.filter(n=>attr(n,'class')==='foundation-comic').length,4);
  const metadata = JSON.parse(fs.readFileSync('src/data/foundations/day-seven-source.json'));
  for (const snapshot of metadata.snapshots) assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/comics/2026-xj/book-one-day-07-v1/'+snapshot.file)).digest('hex'),snapshot.sha256);
  assert.ok(packaged.includes('prefers-reduced-motion: no-preference'));
  assert.ok(packaged.includes('Earth-only estimate at this separation'));
  assert.ok(packaged.includes('It does not include the Sun'));
  assert.ok(!packaged.includes("that's why Day 5"));
  assert.ok(packaged.includes('foundation-slide-fade'));
  for(const page of ['01','02','03','04'])assert.ok(packaged.includes('/comics/2026-xj/book-one-day-07-v1/page-'+page+'.webp'));
  const csp = nodes.find(n => attr(n, 'http-equiv') === 'Content-Security-Policy');
  assert.match(attr(csp, 'content'), /connect-src 'none'/);
  assert.match(attr(csp, 'content'), /form-action 'none'/);
});

test('original timers preserve pause/resume, extension, reset and one completion signal', () => {
  let now = 1000000, tick, cleared = false;
  class Logic {
    props = {};
    setState(change) { Object.assign(this.state, typeof change === 'function' ? change(this.state) : change); }
  }
  const context = {DCLogic: Logic, Date: {now: () => now}, setInterval: fn => {tick = fn; return 1;}, clearInterval: () => {cleared = true;}};
  const Component = vm.runInNewContext(logic(packaged) + '\nComponent;', context);
  const component = new Component();
  let chimes = 0;
  component.chime = () => chimes++;
  component.componentDidMount();
  assert.deepEqual(Array.from(component.ids), ['exit']);
  assert.equal(component.get('exit').left, 120000);
  for (const id of component.ids) {
    const baseline = component.get(id).left;
    component.toggle(id); now += 2500; tick(); component.toggle(id);
    assert.equal(component.get(id).left, baseline - 2500);
    now += 9000; tick(); assert.equal(component.get(id).left, baseline - 2500);
    component.add(id); assert.equal(component.get(id).left, baseline + 57500);
    component.toggle(id); now += baseline + 60000; tick();
    assert.equal(component.get(id).left, 0);
    assert.equal(component.get(id).end, null);
    tick(); component.reset(id); assert.equal(component.get(id).left, baseline);
  }
  assert.equal(chimes, 1);
  component.componentWillUnmount(); assert.ok(cleared);
  for (let i = 1; i <= 5; i++) {
    const key = 'q' + i;
    assert.equal(component.renderVals()[key + 'Open'], false);
    component.renderVals()[key + 'Toggle'](); assert.equal(component.renderVals()[key + 'Open'], true);
    component.renderVals()[key + 'Toggle'](); assert.equal(component.renderVals()[key + 'Open'], false);
  }
});

test('navigation bridge ignores foreign senders, channels and out-of-range requests', () => {
  const listeners = {}, messages = [], navigated = [], parent = {postMessage: (...args) => messages.push(args)};
  const stage = {index: 7, length: 30, goTo: index => navigated.push(index)};
  const window = {parent, addEventListener: (type, listener) => {listeners[type] = listener;}};
  const document = {referrer: 'https://lesson.example/interactive-assignments/day-1-foundation-briefing', querySelector: () => stage, addEventListener: () => {}};
  const bridge=nodes.filter(n=>n.tagName==='script'&&!attr(n,'type')).map(n=>p5.serialize(n)).find(code=>code.includes("const channel = 'physics-day-seven-slides-v1'"));
  vm.runInNewContext(bridge, {window, document, URL});
  const send = (source, origin, data) => listeners.message({source, origin, data});
  const valid = {channel: 'physics-day-seven-slides-v1', type: 'navigate', index: 8};
  send({}, 'https://lesson.example', valid);
  send(parent, 'https://other.example', valid);
  send(parent, 'https://lesson.example', {...valid, channel: 'other'});
  for (const index of [-1, 30, '8', 1.5]) send(parent, 'https://lesson.example', {...valid, index});
  assert.equal(navigated.length, 0);
  send(parent, 'https://lesson.example', valid); assert.deepEqual(navigated, [8]);
  send(parent, 'https://lesson.example', {...valid, type: 'status'});
  assert.equal(messages[0][0].index, 7); assert.equal(messages[0][1], 'https://lesson.example');
});
