// Export the current reader prose and a local interactive preview. No database or publishing.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output) throw new Error('Provide a review output directory.');
fs.mkdirSync(output, { recursive: true });
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mocks = {
  'next-auth/react': 'export const useSession=()=>({data:null,status:"unauthenticated"});',
  'next/link': 'import React from "react";export default function Link({prefetch,...props}){return <a {...props}/>}',
};
const mockPlugin = { name: 'review-only', setup(build) {
  build.onResolve({ filter: /^(next-auth\/react|next\/link)$/ }, a => ({ path: a.path, namespace: 'review-only' }));
  build.onLoad({ filter: /.*/, namespace: 'review-only' }, a => ({ contents: mocks[a.path], loader: 'tsx', resolveDir: root }));
} };
const options = { absWorkingDir: root, bundle: true, jsx: 'automatic', plugins: [mockPlugin], external: ['/avatar/*'], logLevel: 'warning' };
const style = `:root{color-scheme:light;font-family:Georgia,serif;color:#183b30;background:#f5f3eb}*{box-sizing:border-box}body{margin:0}main{max-width:900px;margin:auto;padding:48px 28px}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.08}h2{font-size:1.8rem}h3{font-size:1.2rem}p,li,dd{font-size:1.1rem;line-height:1.7}a{color:#176048}header,section{border-bottom:1px solid #c7d2c6;padding:24px 0}.meta,nav,summary,label,input,button,dt{font-family:system-ui,sans-serif}.meta{font-size:.88rem;line-height:1.5;color:#51695d}.restored{border-left:3px solid #478d67;padding:12px 18px;background:#e8efe5}.intro{font-size:1.35rem}details{background:#fffdf6;padding:16px;margin:16px 0}summary{cursor:pointer}dt{font-weight:650;margin-top:12px}dd{margin-left:0}input{padding:12px;width:100%;font-size:1rem}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}.card{background:#fffdf7;border:1px solid #ccd6c9;padding:20px}.card h3{margin:8px 0}.card p{font-size:.95rem}.card nav a{display:inline-block;margin:6px 14px 0 0}nav{line-height:1.8}.audit{font-size:1rem}button{padding:8px}section{scroll-margin-top:20px}@media print{nav,input,.screen-only{display:none}body{background:white}main{max-width:none;padding:0}details{display:block}section{break-before:auto}h2,h3{break-after:avoid}}`;
const page = (title, body, script = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${style}</style></head><body><main>${body}</main>${script}</body></html>`;

(async () => {
  const dataFile = path.join(output, 'review-data.cjs');
  await esbuild.build({ ...options, platform: 'node', format: 'cjs', loader: { '.css': 'empty' }, outfile: dataFile, stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react';import{renderToStaticMarkup}from'react-dom/server';
    export{CONNECTED_CHAPTERS}from'./src/components/readings/interactive/connected-chapter-catalog';
    export{conversionCatalog}from'./src/components/readings/interactive/conversion-catalog';
    export{SOURCE_REVISIONS}from'./src/components/readings/interactive/source-revisions';
    export{INTERACTIVE_CHAPTERS}from'./src/components/readings/interactive/registry';
    import{ChapterTwoSection}from'./src/components/readings/interactive/ChapterTwoContent';
    import{ReaderStoryProvider}from'./src/components/readings/interactive/ReaderStory';
    export const chapterTwoHTML=(id)=>renderToStaticMarkup(<ReaderStoryProvider sampleStudent><ChapterTwoSection id={id}/></ReaderStoryProvider>);
  ` } });
  const { CONNECTED_CHAPTERS: chapters, conversionCatalog: catalog, SOURCE_REVISIONS: revisions, INTERACTIVE_CHAPTERS: definitions, chapterTwoHTML } = require(dataFile);
  assert.equal(catalog.length, 73);
  assert.equal(catalog.reduce((n, c) => n + c.sections.length, 0), 551);
  assert.equal(Object.keys(revisions).length, catalog.length);
  for (const c of catalog) {
    assert.equal(c.status, 'ready');
    assert.deepEqual([...c.ready].sort(), [...c.sections].sort());
    const revision = revisions[`${c.book}:${c.chapter}`];
    assert.ok(revision?.invitation);
    const definition = definitions.find(d => d.book === c.book && d.chapter === c.chapter);
    for (const [number, change] of Object.entries(revision.sections)) {
      const section = definition.sections.find(s => s.number === number);
      assert.ok(section, `Unknown ${c.book} section ${number}`);
      const pages = section.pages.match(/\d+/g).map(Number);
      // Hewitt's personal scaffold essay on p. 15 motivates section 2.2 on p. 16.
      const startsAt = c.book === 'hewitt' && number === '2.2' ? 15 : pages[0];
      assert.ok(change.sourcePages.length && change.sourcePages.every(p => p >= startsAt && p <= pages.at(-1)), `Source page outside ${c.book} ${number}: ${section.pages}`);
    }
    const content = chapters.find(d => d.definition.book === c.book && d.definition.chapter === c.chapter);
    const sections = definition.sections.map(section => {
      const lesson = content?.lessons.find(l => l.number === section.number);
      const change = revision.sections[section.number];
      // Chapter 2 is hand-authored JSX: extract its prose from the actual rendered component.
      const prose = lesson ? lesson.paragraphs.map(p => `<p>${escape(p)}</p>`).join('') : [...chapterTwoHTML(section.id).matchAll(/<(p|h3)\b[^>]*>[\s\S]*?<\/\1>/g)].map(m => m[0]).join('');
      assert.ok(prose.length > 200, `Empty draft: ${c.book} ${section.number}`);
      const vocabulary = lesson ? `<h3>Words for your explanation</h3><dl>${lesson.terms.map(([t, d]) => `<dt>${escape(t)}</dt><dd>${escape(d)}</dd>`).join('')}</dl><h3>${escape(lesson.worked.title)}</h3><p>${escape(lesson.worked.prompt)}</p><details><summary>Compare your reasoning</summary><p>${escape(lesson.worked.reasoning)}</p></details>` : '';
      return `<section id="s-${section.number}"><p class="meta">${escape(c.book === 'hewitt' ? 'Hewitt' : 'OpenStax')} · ${escape(section.pages)} · <a href="${escape(section.sourceUrl)}">Original textbook</a></p><h2>${escape(section.number)} · ${escape(section.title)}</h2>${change ? `<details class="restored"><summary>Restored in this revision · source pp. ${change.sourcePages.join(', ')}</summary><p class="audit">${escape(change.restored)}</p></details>` : ''}${prose}${vocabulary}<details><summary>Practice check and teaching notes</summary><p>${escape(section.check.prompt)}</p><ol>${section.check.options.map(o => `<li>${escape(o)}</li>`).join('')}</ol><p><strong>Answer:</strong> ${escape(section.check.options[section.check.correct])}</p><p>${escape(section.check.teacher)}</p></details></section>`;
    }).join('');
    const filename = `${c.book}-${String(c.chapter).padStart(2, '0')}.html`;
    const attribution = c.book === 'openstax' ? '<p class="meta">Adapted from <a href="https://openstax.org/details/books/college-physics-ap-courses-2e">OpenStax College Physics for AP® Courses 2e</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>. This revision uses original paraphrases.</p>' : '<p class="meta">Original instructional adaptation aligned to Paul G. Hewitt, Conceptual Physics. The complete publisher text remains in the reference PDF.</p>';
    fs.writeFileSync(path.join(output, filename), page(`${c.book} ${c.chapter} · ${c.title}`, `<nav><a href="index.html">← All drafts</a> · <a href="interactive.html?book=${c.book}&chapter=${c.chapter}">Interactive preview</a></nav><header><p class="meta">TEACHER REVIEW DRAFT · OCTOBER 23, 2026</p><h1>${escape(c.chapter)} · ${escape(c.title)}</h1><p class="intro">${escape(revision.invitation)}</p><p class="meta">Prose edition with practice answers. Diagrams and controls are available in the interactive preview.</p>${attribution}<nav>${definition.sections.map(s => `<a href="#s-${s.number}">${s.number}</a>`).join(' · ')}</nav></header>${sections}`));
    c.reviewFile = filename;
    c.revisedSections = Object.keys(revision.sections);
  }
  const count = catalog.reduce((n, c) => n + c.revisedSections.length, 0);
  fs.writeFileSync(path.join(output, 'final-content.json'), JSON.stringify(chapters, null, 2));
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ chapters: catalog.length, sections: 551, revisedSections: count, catalog }, null, 2));
  const cards = catalog.map(c => `<article class="card" data-search="${escape(`${c.book} ${c.chapter} ${c.title}`.toLowerCase())}"><span class="meta">${c.book === 'hewitt' ? 'HEWITT' : 'OPENSTAX'} · CHAPTER ${c.chapter}</span><h3>${escape(c.title)}</h3><p>${c.sections.length} sections present · ${c.revisedSections.length} passages restored</p><nav><a href="${c.reviewFile}">Read draft</a><a href="interactive.html?book=${c.book}&chapter=${c.chapter}">Interactive</a></nav></article>`).join('');
  fs.writeFileSync(path.join(output, 'index.html'), page('Interactive reader drafts · Source revision', `<header><p class="meta">TEACHER REVIEW · OCTOBER 23, 2026</p><h1>Readers with their<br>examples restored.</h1><p class="intro">73 chapters · 551 sections present · ${count} source-based passage revisions.</p><p>Every chapter has a revised invitation. This pass restores selected demonstrations, historical context, worked-example setups, and explanations of results. It preserves the existing chapter content, figures, checks, and section identifiers.</p><p>The chapter inventory was already complete. These are refreshed drafts, with all existing sections included. This is a targeted source-fidelity pass, not a claim that every sentence or every source exercise has been reproduced.</p><details><summary>What changed—and what to review</summary><p>Each revised passage records its printed source pages and the element restored. Source ideas are paraphrased in original prose. Dated prices and technology claims are kept as historical examples where useful; misleading explanations are qualified, including perpetual motion, quantum tunneling, and relativistic mass.</p><p>Hewitt was checked against locally retained source-page extractions and page images. OpenStax was checked against the local College Physics for AP® Courses 2e PDF. Static drafts contain teaching answers; interactive previews use sample student artwork and local browser storage. Nothing in this export writes to student records.</p><p>For a next editorial pass, review the density and placement of the new examples in the chapters you teach first. The source PDF links remain available in every section.</p></details></header><section><label for="search">Find a book, chapter, or topic</label><input id="search" type="search" placeholder="Try: momentum, OpenStax 17, equilibrium"><p id="count" class="meta">73 drafts</p><div class="cards">${cards}</div></section>`, `<script>document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let n=0;document.querySelectorAll('.card').forEach(c=>{c.hidden=!q.split(/\s+/).every(s=>c.dataset.search.includes(s));if(!c.hidden)n++});document.querySelector('#count').textContent=n+' drafts'});</script>`));
  await esbuild.build({ ...options, platform: 'browser', format: 'iife', minify: true, outfile: path.join(output, 'interactive.js'), stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React from 'react';import{createRoot}from'react-dom/client';
    import Reader from './src/components/readings/interactive/ConnectedChapterReader';
    import ChapterTwoReader from './src/components/readings/interactive/ChapterTwoReader';
    import{INTERACTIVE_CHAPTERS}from'./src/components/readings/interactive/registry';
    const q=new URLSearchParams(location.search),book=q.get('book')||'hewitt',chapter=Number(q.get('chapter')||2);
    const definition=INTERACTIVE_CHAPTERS.find(d=>d.book===book&&d.chapter===chapter);
    const props={preview:true,storageKey:'source-review:'+book+':'+chapter,backLink:<a href="index.html">All review drafts</a>};
    if(!definition)throw new Error('Unknown review chapter');
    createRoot(document.getElementById('root')).render(book==='hewitt'&&chapter===2?<ChapterTwoReader {...props}/>:<Reader {...props} definition={definition}/>);
  ` } });
  fs.writeFileSync(path.join(output, 'interactive.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interactive reader · Local draft</title><link rel="stylesheet" href="interactive.css"><style>body{margin:0}*{box-sizing:border-box}button,input,textarea{font:inherit}</style></head><body><div id="root"></div><script src="interactive.js"></script></body></html>');
  console.log(JSON.stringify({ output, chapters: catalog.length, sections: 551, revisedSections: count }));
})().catch(error => { console.error(error); process.exitCode = 1; });
