// One-time private upload using the existing production build environment.
// No credentials are returned, persisted, or exposed in the generated site.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan.json')));
assert.equal(plan.length, 39);
assert.deepEqual(plan.map(f => f.chapter), Array.from({ length: 39 }, (_, i) => i + 2));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data: bucket, error } = await client.storage.getBucket('textbook');
  if (error) throw error;
  assert.equal(bucket.public, false, 'The textbook bucket must remain private');
  const uploaded = [];
  for (const file of plan) {
    assert.equal(file.key, `pt/cp${String(file.chapter).padStart(2, '0')}.pdf`);
    const local = path.join(__dirname, path.basename(file.key)), bytes = fs.readFileSync(local);
    assert.equal(sha(bytes), file.sha256, 'Deployment input differs from reviewed PDF');
    const { error: uploadError } = await client.storage.from('textbook').upload(file.key, bytes, { upsert: true, contentType: 'application/pdf', cacheControl: '0' });
    if (uploadError) throw uploadError;
    const { data, error: downloadError } = await client.storage.from('textbook').download(file.key);
    if (downloadError) throw downloadError;
    assert.equal(sha(Buffer.from(await data.arrayBuffer())), file.sha256, 'Private storage read-back mismatch');
    uploaded.push(file);
    console.log(`TEXTBOOK_VERIFIED ${JSON.stringify(file)}`);
    fs.unlinkSync(local);
  }
  console.log(`TEXTBOOK_PUBLICATION ${JSON.stringify({ bucket: 'textbook', private: true, uploaded })}`);
})().catch(error => { console.error('Textbook publication failed:', error.message); process.exitCode = 1; });
