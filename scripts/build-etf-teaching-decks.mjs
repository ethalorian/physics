import {formatDeckMath} from '../src/data/deck-sources/worksheet-guided/math-typography.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWorkshop, updatePrintLesson } from './trades-etf/workshop-builder.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const days = read('scripts/trades-etf/days.json');
const units = read('src/data/trades-etf-units.json');
const output = path.join(root, 'public/decks/trades-etf');
fs.mkdirSync(output, {recursive:true});
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brand = '<div class="brand"><img src="/decks/unit-1-cpa/logo.png" alt="" width="48" height="48"><span>ANTOCCI PHYSICS</span></div>';
const manifest = [], activities = [];

const workshop = [];
for (const day of days) {
  const unitId = `trades-etf-${day.project}`, src = `/decks/trades-etf/${day.slug}.html`;
  const result = buildWorkshop(root, day), slides = result.slides;
  workshop.push(result.lesson);
  updatePrintLesson(root, day, result);
  slides.forEach((slide, index) => {
    if (!slide.activity) return;
    const {kind,domain,prompt} = slide.activity;
    slide.activityId = `${day.slug}-${kind === 'warmup' ? 'warmup' : kind === 'exit_ticket' ? 'exit' : domain}`;
    activities.push({id:slide.activityId,unitId,day:day.meeting,track:'shared',src,slide:index+1,title:slide.title,prompt,targetSlug:`etf26.p${day.project}.${domain}`,kind,usesVisual:false});
  });
  const sections = slides.map((slide, i) => `<section class="slide ${slide.className ?? ''}" id="slide-${i+1}" data-title="${esc(slide.title)}" data-label="${esc(slide.title)}" data-speaker-notes="${esc(slide.notes ?? '')}" data-solution="${Boolean(slide.solution)}"${slide.activityId ? ` data-activity-id="${slide.activityId}"` : ''} aria-hidden="true"><div class="tag">${esc(slide.tag)}</div><${i === 0 ? 'h1' : 'h2'}>${esc(slide.title)}</${i === 0 ? 'h1' : 'h2'}><div class="content">${formatDeckMath(slide.body)}</div><footer class="footer"><span>ETF / Unit ${day.project} / Day ${day.meeting}</span><span>${i+1} / ${slides.length}</span></footer></section>`).join('');
  const toolbar = `<nav class="toolbar" aria-label="Deck controls"><a class="optional" href="/admin/command-center?unit=${unitId}&amp;day=${day.meeting}">Teach</a><a class="optional" href="/trades-etf/${day.diagram}.svg" target="_blank" rel="noopener">Drawing</a><button id="prev" aria-label="Previous slide">←</button><span id="count" aria-live="polite"></span><button id="next" aria-label="Next slide">→</button><select id="slideSelect" aria-label="Choose slide">${slides.map((s,i)=>`<option value="${i}">${i+1}. ${esc(s.title)}</option>`).join('')}</select><button id="replay">Replay drawing</button><button id="reset">Reset</button><button id="notes" class="optional">Teacher notes</button><button id="fullscreen" class="optional">Full screen</button></nav>`;
  fs.writeFileSync(path.join(output, day.slug+'.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ETF Unit ${day.project} · Day ${day.meeting}: ${esc(day.title)}</title><link rel="stylesheet" href="./style.css"><link rel="stylesheet" href="/decks/worksheet-guided/solutions.css"></head><body data-unit="${day.project}" data-day="${day.meeting}"><main class="stage-shell"><deck-stage class="stage">${sections}</deck-stage></main>${toolbar}<script src="/decks/worksheet-guided/motion.js"></script><script src="./runtime.js"></script></body></html>`);
  manifest.push({unitId, unit:day.project, day:day.meeting, title:day.title, src, slides:slides.length, lessonId:day.lesson_id, slug:day.slug, diagram:day.diagram});
}
for (const [source, dest] of [['deck-style.css','style.css'],['deck-runtime.js','runtime.js']]) fs.copyFileSync(path.join(root,'scripts/trades-etf',source),path.join(output,dest));
fs.writeFileSync(path.join(root,'src/data/trades-etf-workshop.json'),JSON.stringify(workshop,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/data/trades-etf-decks.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/data/trades-etf-deck-activities.json'),JSON.stringify(activities,null,2)+'\n');
function hub(unit) {
  const heading = unit ? units['trades-etf-'+unit] : 'ETF teaching decks';
  const content = [1,2,3,4].filter(n=>!unit||unit===n).map(n=>`<section><h2>${esc(units['trades-etf-'+n])}</h2>${manifest.filter(d=>d.unit===n).map(d=>`<article class="hub-list"><span class="day">${String(d.day).padStart(2,'0')}</span><h3><a href="./${d.slug}.html">${esc(d.title)}</a></h3><small>${d.slides} slides<br>Workshop edition</small></article>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title><link rel="stylesheet" href="./style.css"></head><body><main class="reading">${brand}<h1>${esc(heading)}</h1><p>Choose your class, unit and day in Teach to control the classroom screen and launch the opening question, practice response or exit ticket. Saved individual responses are available for teacher review.</p><nav><a href="/admin/command-center${unit?'?unit=trades-etf-'+unit+'&amp;day=1':''}">Open Teach</a><a href="/admin/teacher/plans${unit?'?unit=trades-etf-'+unit:''}">Course Plans</a><a href="/trades-etf/drawings.html">Drawing sheets</a></nav>${content}</main></body></html>`;
}
fs.writeFileSync(path.join(output,'index.html'),hub());
for (const unit of [1,2,3,4]) fs.writeFileSync(path.join(output,`unit-${unit}.html`),hub(unit));
console.log(`Built ${manifest.length} ETF decks, ${manifest.reduce((sum,d)=>sum+d.slides,0)} slides and ${activities.length} connected activities.`);
