// Local editorial record for the teacher; never calls translation services.
const fs = require('node:fs'), path = require('node:path');
const work = process.argv[2], output = process.argv[3];
if (!work || !output) throw new Error('Pass work and output directories');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sources = fs.readdirSync(work).filter(f => f.endsWith('.source.json')).sort().map(f => JSON.parse(fs.readFileSync(path.join(work, f))));
const issues = [], chapters = [];
for (const source of sources) {
  let corrections = 0, overrides = 0;
  for (const page of source.pages) {
    const name = `cp${String(source.chapter).padStart(2, '0')}.p${String(page.page).padStart(3, '0')}`;
    const es = JSON.parse(fs.readFileSync(path.join(work, name + '.pt.json')));
    const review = JSON.parse(fs.readFileSync(path.join(work, name + '.review.json')));
    corrections += review.corrections?.length || 0;
    overrides += es.layoutOverrides?.length || 0;
    const notes = Array.isArray(review.sourceIssues) ? review.sourceIssues : review.sourceIssues ? [review.sourceIssues] : [];
    for (const note of notes) issues.push({ chapter: source.chapter, pdfPage: page.page, note });
  }
  chapters.push({ chapter: source.chapter, pages: source.pages.length, corrections, layoutRepairs: overrides });
}
const audit = JSON.parse(fs.readFileSync(path.join(work, 'integrity-report.json')));
const independentReviews = fs.readdirSync(output).filter(name => /^independent-review-.*\.json$/.test(name)).sort().map(name => ({ file: name, ...JSON.parse(fs.readFileSync(path.join(output, name))) }));
const report = { chapters, pages: audit.pages, reviewed: audit.reviewed, illustrationPages: audit.labels, reviewer: 'Codex agent', independentReviews, numericNotation: 'Source notation retained: decimal point (0.5) and comma thousands separator (1,000). Explained in the reader and the first page of every Portuguese chapter.', sourceIssues: issues };
fs.writeFileSync(path.join(output, 'editorial-review.json'), JSON.stringify(report, null, 2));
const issueRows = issues.map(issue => `<tr><td>${issue.chapter}</td><td>${issue.pdfPage}</td><td>${escape(typeof issue.note === 'string' ? issue.note : JSON.stringify(issue.note))}</td></tr>`).join('');
const chapterRows = chapters.map(c => `<tr><td>${c.chapter}</td><td>${c.pages}</td><td>${c.corrections}</td><td>${c.layoutRepairs}</td></tr>`).join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Portuguese textbook — teacher review record</title><style>body{max-width:1050px;margin:50px auto;padding:0 24px;font:16px/1.55 system-ui;color:#172337}h1{font-size:30px}h2{font-size:22px;margin-top:36px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:10px;border:1px solid #cbd5e1;vertical-align:top;text-align:left}th{background:#edf2fa}p{max-width:85ch}.note{background:#f0f5fb;border-left:4px solid #6559ba;padding:16px}a{color:#4b3b9a}</style>
<h1>Portuguese textbook: teacher review record</h1>
<p>The translated edition covers all 39 chapters available in the current reader (chapters 2–40), totaling 808 original PDF pages. Chapter 1 was not in the supplied reader source.</p>
<p>The Brazilian Portuguese edition was translated directly by Codex agents using the English source, with bilingual checking and shared physics terminology. No separate model or translation API was used for this edition. The translation and review were performed by AI; they are not certification by a human translator or a Portuguese-speaking physics educator.</p>
<p>The review checked meaning, physics terminology, numeric values, protected symbols, questions, captions, and source page images. Page-specific repairs restore formulas and text fragmented by PDF extraction. Visual checks cover chapter openings, summaries, repaired equations, and selected exercise and illustration pages. Automated checks verify all chapters, page counts, review coverage, source hashes, numbers, protected symbols, and current render inputs.</p>
<p>The English/Español/Português control keeps the current chapter and PDF page and remembers the language preference. Original printed-page identities are retained. Text embedded in artwork is preserved, with a Portuguese translation key on the same PDF page; these keys can make a page taller. Some visual word puzzles retain their original artwork to preserve the exercise.</p>
<p>Numbers retain the English source notation: a decimal point (0.5) and commas for thousands (1,000). A Portuguese explanation appears in the reader and on the first page of each chapter so students can interpret examples and diagram values consistently.</p>
<p>Every page has an author review record. Additional reviews by a different Codex agent sample the English and Portuguese text and rendered pages; the accompanying editorial-review.json records their exact coverage and findings. Visual sampling does not mean every page was individually inspected at full resolution.</p>
<p class="note">The notes below flag wording, dated information, or possible factual issues in the original edition. They are separate from translation corrections. The Portuguese generally preserves the source; these notes are for your instructional judgment and do not constitute a revised science edition.</p>
<h2>Source notes</h2><p>Page numbers below are positions within each chapter PDF. Use the reader’s chapter navigation and page controls to locate the corresponding original printed page.</p><table><thead><tr><th>Chapter</th><th>PDF page</th><th>Reviewer note</th></tr></thead><tbody>${issueRows || '<tr><td colspan="3">No source notes recorded.</td></tr>'}</tbody></table>
<h2>Coverage</h2><p>${audit.reviewed} of ${audit.pages} pages have a current bilingual review; ${audit.labels} pages have illustration-review records. Counts below describe recorded corrections and layout repairs; these are AI reviews.</p><table><thead><tr><th>Chapter</th><th>Pages</th><th>Recorded corrections</th><th>Layout repairs</th></tr></thead><tbody>${chapterRows}</tbody></table></html>`;
fs.writeFileSync(path.join(output, 'teacher-review.html'), html);
console.log(JSON.stringify({ chapters: chapters.length, pages: audit.pages, sourceNotes: issues.length, report: path.join(output, 'teacher-review.html') }));
