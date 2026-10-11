import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons, p } from '../src/data/deck-sources/unit-1-teaching/lessons.mjs';
import { enhance } from '../src/data/deck-sources/unit-1-teaching/enhancements.mjs';
import { cpaLessons, addConceptOpeners } from '../src/data/deck-sources/unit-1-teaching/cpa-lessons.mjs';
import { illustrateDeck } from '../src/data/deck-sources/unit-1-teaching/visuals.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/data/deck-sources/unit-1-teaching');

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = s => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
enhance(lessons);
for (const [edition, curriculum, folder] of [['honors',lessons,'unit-1-teaching'],['cpa',cpaLessons,'unit-1-cpa']]) {
const editionLabel = edition === 'cpa' ? 'CPA Physics' : 'Honors Physics';
const otherFolder = edition === 'cpa' ? 'unit-1-teaching' : 'unit-1-cpa';
const otherLabel = edition === 'cpa' ? 'Honors' : 'CPA';
const output = path.join(root, 'public/decks', folder);
fs.mkdirSync(output, { recursive: true });
fs.cpSync(path.join(source, 'fonts'), path.join(output, 'fonts'), { recursive: true });
let fonts = '';
for (const [family, name] of [['IBM Plex Mono', 'mono'], ['Newsreader', 'news']]) {
  for (const weight of [400, 500, 600]) fonts += `@font-face{font-family:'${family}';font-weight:${weight};src:url('./fonts/${name}${weight}.ttf') format('truetype');font-display:swap}`;
}
fs.writeFileSync(path.join(output, 'style.css'), fonts + fs.readFileSync(path.join(source, 'style.css'), 'utf8'));
fs.copyFileSync(path.join(source, 'runtime.js'), path.join(output, 'runtime.js'));
for (const file of ['visuals.css', 'visuals.js']) fs.copyFileSync(path.join(source, file), path.join(output, file));
fs.cpSync(path.join(source, 'art'), path.join(output, 'art'), { recursive: true });
fs.copyFileSync(path.join(root, 'public/brand/antocci-physics.png'), path.join(output, 'logo.png'));
const brand = `<div class="brand"><img src="./logo.png" alt="" width="48" height="48" style="display:block;flex:none;border-radius:8px"><span>ANTOCCI PHYSICS</span></div>`;
const manifest = [];
for (const lesson of curriculum) {
  const { day, title, target, slides, materials, pacing, exit, exitKey, route } = lesson;
  const assessment = day >= 21;
  const deck = [
    {title, body:p(target), note:`Learning target: ${target} Preparation: ${materials} Suggested pacing: ${pacing}.`, tag:`${editionLabel} • Unit 1 • Day ${day}`, cover:true, dark:true},
    {title:'Today’s learning evidence', body:p(target)+p(`<strong>You will use:</strong> ${materials}`)+p(assessment?'Keep your own calculations and explanations visible in the submitted work.':'Attempt each question before viewing feedback. Keep calculations, sketches, and explanations in your notebook.'), tag:'Learning target', anchor:'b1', note:`Pacing: ${pacing}. Questions and solutions occupy separate slides. Preserve time for students to think, calculate, explain, and revise.`},
  ];
  const deferred = [];
  for (const slide of slides) {
    deck.push(slide);
    if (slide.answer) {
      const answer = {title:slide.title, body:slide.answer, tag:'Solution and reasoning', note:slide.note, solution:true, visual:!!slide.answerVisual};
      if (slide.deferAnswer) deferred.push(answer); else deck.push(answer);
    }
  }
  deck.push(...deferred);
  deck.push({title:'Independent exit evidence', tag:assessment?'Session checkpoint':'Exit ticket', body:p(exit)+(assessment?'':p('<strong>After responding:</strong> Rate today’s target: 1 = Not yet, 2 = With some help or errors, 3 = Independently and with an explanation. Name the evidence for your rating.')), note:`Expected evidence: ${exitKey} Next teaching move: ${route}`});
  if (!assessment) deck.push({title:'Exit feedback', tag:'Reveal after collecting responses', body:p(exitKey)+p('Use the explanation to correct your work. A confidence rating alone does not demonstrate the target.'), note:route, solution:true});
  if (edition === 'honors') {
    illustrateDeck(day, deck);
    addConceptOpeners(day, deck);
  } else {
    deck[0].art = [1,4,5,6,19,20,21,22].includes(day) ? 'space' : 'lab';
    deck[0].note += ' CPA edition: model the visual, invite spoken reasoning, then release students to guided and independent attempts. Artwork is conceptual, not measured data.';
  }
  const sections = deck.map((slide, i) => {
    const focus = !slide.cover && !slide.visual && !/<(?:table|ul)|class="(?:chart|forceplot|vectorplot|simulation)/.test(slide.body) && clean(slide.body).split(' ').length < 65;
    return `<section class="slide ${slide.dark?'dark':''} ${slide.cover?'cover':''} ${focus?'focus':''} ${slide.visual?'visual-slide':''} ${slide.art?'art-'+slide.art:''}" id="slide-${i+1}" data-title="${esc(slide.title)}" data-label="${esc((slide.solution?'Solution · ':'')+slide.title)}" data-speaker-notes="${esc(slide.note)}"${slide.anchor?` data-section-anchor="${esc(slide.anchor)}"`:''} data-solution="${!!slide.solution}" aria-hidden="true">${slide.cover?brand:''}<div class="tag">${esc(slide.tag||'Explanation and application')}</div><${slide.cover?'h1':'h2'}>${esc(slide.title)}</${slide.cover?'h1':'h2'}><div class="content">${slide.body}</div>${slide.cover?'<div class="fiction">THIS IS FICTION. THE PHYSICS IS REAL.</div>':''}<footer class="footer"><span>${editionLabel} / Unit 1 / Day ${day}</span><span>${i+1} / ${deck.length}</span></footer></section>`;
  }).join('');
  const toolbar = `<nav class="toolbar" aria-label="Deck controls"><a class="optional" href="/admin/command-center?unit=unit-1&amp;day=${day}">iPad Teach</a><a class="optional edition-link" href="../${otherFolder}/day-${String(day).padStart(2,'0')}.html">${otherLabel} edition</a><button id="prev" aria-label="Previous slide">←</button><span id="count" aria-live="polite"></span><button id="next" aria-label="Next slide">→</button><select id="slideSelect" aria-label="Choose slide">${deck.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}${s.solution?' (solution)':''}</option>`).join('')}</select><button id="reset">Reset</button><button id="notes">Teacher notes</button><button id="fullscreen" class="optional">Full screen</button></nav>`;
  const file = `day-${String(day).padStart(2,'0')}.html`;
  fs.writeFileSync(path.join(output, file), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${editionLabel} · Day ${day}: ${esc(title)}</title><link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./visuals.css"></head><body class="deck-page edition-${edition}" data-day="${day}" data-edition="${edition}"><main class="stage-shell"><deck-stage class="stage">${sections}</deck-stage></main>${toolbar}<script>window.NOTES=${JSON.stringify(deck.map(s=>s.note)).replace(/</g,'\\u003c')};</script><script src="./runtime.js"></script><script src="./visuals.js"></script></body></html>`);
  manifest.push({day, title, slides:deck.length, src:`/decks/${folder}/${file}`});
}
fs.writeFileSync(path.join(root, `src/data/unit1-${edition === 'cpa' ? 'cpa' : 'teaching'}-decks.json`), JSON.stringify(manifest, null, 2)+'\n');
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unit 1 · ${editionLabel}</title><link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="./visuals.css"></head><body><main class="reading">${brand}<h1>Unit 1 · ${editionLabel}</h1><p>Choose a lesson below. <a class="edition-switch" href="../${otherFolder}/index.html">Open the ${otherLabel} set →</a></p><p>Use <a href="/admin/command-center">iPad Teach</a> to control the classroom screen.</p>${manifest.map(m=>`<article class="hub-list"><span class="day">${m.day}</span><h2><a href="./${path.basename(m.src)}">${esc(m.title)}</a></h2><span>${m.slides} slides</span></article>`).join('')}</main></body></html>`);
console.log(`Built ${manifest.length} ${editionLabel} decks, ${manifest.reduce((sum,m)=>sum+m.slides,0)} slides.`);

}
