// Upload only complete, reviewed, current Portuguese PDFs to the private bucket.
// Model APIs are deliberately not part of this publication path.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const work = process.argv[2], output = process.argv[3];
if (!work || !output) throw new Error('Pass translation work and PDF output directories');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
execFileSync(process.execPath, [path.join(__dirname, 'audit.cjs'), work, '--strict'], { stdio: 'inherit' });
const rendererHash = sha(fs.readFileSync(path.join(__dirname, 'render.py')));
const pdfChecks = JSON.parse(fs.readFileSync(path.join(output, 'qa/pdf-integrity-02-40.json')));
assert.equal(pdfChecks.length, 39, 'Run the final PDF integrity checks before publication');
const files = [];
for (let chapter = 2; chapter <= 40; chapter++) {
  const name = `cp${String(chapter).padStart(2, '0')}`;
  const source = JSON.parse(fs.readFileSync(path.join(work, name + '.source.json')));
  const manifest = JSON.parse(fs.readFileSync(path.join(output, name + '.manifest.json')));
  const data = fs.readFileSync(path.join(output, name + '.pdf'));
  assert.equal(manifest.chapter, chapter);
  assert.equal(manifest.pages, source.pages.length, 'Page identity changed');
  assert.equal(manifest.sourceHash, source.sha256, 'Source snapshot differs');
  assert.equal(manifest.rendererHash, rendererHash, 'PDF needs the final renderer');
  assert.equal(manifest.pdfSha256, sha(data), 'PDF differs from render manifest');
  assert.equal(pdfChecks.find(c => c.chapter === chapter)?.sha256, manifest.pdfSha256, 'PDF integrity check predates the current render');
  assert.equal(manifest.inputs.length, source.pages.length * 2);
  for (const input of manifest.inputs) {
    assert(input.sha256, 'Illustration review missing at render time');
    assert.equal(sha(fs.readFileSync(path.join(work, input.file))), input.sha256, `PDF predates reviewed input ${input.file}`);
  }
  files.push({ chapter, key: 'pt/' + name + '.pdf', data, sha256: manifest.pdfSha256 });
}
if (process.argv.includes('--stage-build')) {
  const stage = process.argv[process.argv.indexOf('--stage-build') + 1];
  assert(stage, 'Provide a private deployment staging directory');
  fs.mkdirSync(stage, { recursive: true });
  for (const file of files) fs.writeFileSync(path.join(stage, path.basename(file.key)), file.data);
  fs.writeFileSync(path.join(stage, 'plan.json'), JSON.stringify(files.map(({ data, ...record }) => ({ ...record, bytes: data.length })), null, 2));
  fs.copyFileSync(path.join(__dirname, 'publish-build.cjs'), path.join(stage, 'run.cjs'));
  console.log(`Staged ${files.length} verified private PDFs for publication in the deployment build.`);
  process.exit(0);
}
require('dotenv').config({ path: process.env.TEXTBOOK_ENV_FILE || path.join(root, '.env.local'), quiet: true });
const { createClient } = require(path.join(root, 'node_modules/@supabase/supabase-js'));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data: bucket, error } = await client.storage.getBucket('textbook');
  if (error) throw error;
  assert.equal(bucket.public, false, 'Refusing to publish textbook into a public bucket');
  const uploaded = [];
  for (const file of files) {
    const { error: uploadError } = await client.storage.from('textbook').upload(file.key, file.data, { upsert: true, contentType: 'application/pdf', cacheControl: '0' });
    if (uploadError) throw uploadError;
    const { data: downloaded, error: downloadError } = await client.storage.from('textbook').download(file.key);
    if (downloadError) throw downloadError;
    assert.equal(sha(Buffer.from(await downloaded.arrayBuffer())), file.sha256, 'Uploaded bytes failed read-back verification');
    uploaded.push({ chapter: file.chapter, key: file.key, sha256: file.sha256, bytes: file.data.length });
    fs.writeFileSync(path.join(output, 'publication.json'), JSON.stringify({ bucket: 'textbook', private: true, uploaded }, null, 2));
    console.log(`Verified private Portuguese chapter ${file.chapter} (${uploaded.length}/39)`);
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
