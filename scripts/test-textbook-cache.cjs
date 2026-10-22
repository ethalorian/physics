// Exercises the real route with a conditional Storage fixture. No live writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

async function buildRoute() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'textbook-cache-'));
  const mocks = {
    '@/lib/api-auth': `export const withAuth = fn => (req, ctx) =>
      req.headers.get('x-test-user') === 'student' || req.headers.get('cookie')?.includes('fixture-session=student')
        ? fn(req, ctx) : Response.json({error:'Unauthorized'}, {status:401, headers:{'Cache-Control':'no-store'}});`,
    '@/lib/supabase': 'export const supabaseAdmin = globalThis.__textbookStorage;',
    'next/server': 'export const NextResponse = Response;',
  };
  await require('esbuild').build({
    entryPoints: [path.join(root, 'src/app/api/textbook/[chapter]/route.ts')],
    outfile: path.join(out, 'route.cjs'), bundle: true, platform: 'node', format: 'cjs',
    plugins: [{ name: 'fixtures', setup(b) {
      b.onResolve({ filter: /.*/ }, a => mocks[a.path] ? { path: a.path, namespace: 'fixture' } : undefined);
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'ts' }));
    } }],
  });
  return { GET: require(path.join(out, 'route.cjs')).GET, cleanup: () => fs.rmSync(out, { recursive: true, force: true }) };
}

async function main() {
  const originalFetch = global.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://storage.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service-key';
  const objects = new Map();
  const requests = [];
  let legacyUrl = null, legacyReads = 0, transferred = 0;
  let omit304Etag = false, statusOverride = null;
  const privateUrl = (key) => `https://storage.test/storage/v1/object/textbook/${key}`;
  const put = (key, version) => objects.set(privateUrl(key), { etag: `"${key}-${version}"`, body: `%PDF-${key}-${version}` });
  for (const key of ['cp02.pdf', 'cp03.pdf', 'es/cp02.pdf', 'pt/cp02.pdf']) put(key, 'v1');
  global.__textbookStorage = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => {
    legacyReads++; return { data: legacyUrl ? { text_pdf_url: legacyUrl } : null };
  } }) }) }) };
  global.fetch = async (url, options) => {
    const headers = new Headers(options.headers);
    requests.push({ url, headers, options });
    assert.equal(options.cache, 'no-store', 'no Next shared cache in front of session validation');
    assert.equal(headers.get('cache-control'), 'no-cache', 'revalidate upstream CDN objects');
    assert.equal(headers.get('cookie'), null, 'never forward the student session');
    assert.equal(headers.get('range'), null, 'do not accidentally return a partial PDF as a full response');
    assert.equal(headers.get('authorization'), url.startsWith('https://storage.test/') ? 'Bearer fixture-service-key' : null);
    assert.equal(headers.get('apikey'), url.startsWith('https://storage.test/') ? 'fixture-service-key' : null);
    if (statusOverride) return new Response('upstream error', { status: statusOverride });
    const object = objects.get(url);
    if (!object) return new Response('missing', { status: 404 });
    const validator = headers.get('if-none-match');
    const matches = validator === '*' || validator?.split(',').some(tag => tag.trim().replace(/^W\//, '') === object.etag);
    if (matches) return new Response(null, { status: 304, headers: omit304Etag ? {} : { ETag: object.etag } });
    transferred += Buffer.byteLength(object.body);
    return new Response(object.body, { headers: { ETag: object.etag, 'Cache-Control': 'public, max-age=3600' } });
  };
  const { GET, cleanup } = await buildRoute();
  const request = (lang = 'en', etag, { user = true, chapter = '2', extraHeaders = {} } = {}) => GET(
    new Request(`http://fixture/api/textbook/${chapter}?lang=${lang}`, { headers: {
      ...(user ? { 'x-test-user': 'student' } : {}), ...(etag ? { 'If-None-Match': etag } : {}), ...extraHeaders,
    } }), { params: Promise.resolve({ chapter }) },
  );
  try {
    const tags = {};
    for (const lang of ['en', 'es', 'pt']) {
      const key = lang === 'en' ? 'cp02.pdf' : `${lang}/cp02.pdf`;
      let response = await request(lang, undefined, { extraHeaders: { cookie: 'private=session', Range: 'bytes=0-20' } });
      assert.equal(response.status, 200);
      assert.equal(await response.text(), `%PDF-${key}-v1`);
      assert.equal(response.headers.get('cache-control'), 'private, max-age=0, must-revalidate');
      assert.equal(response.headers.get('content-language'), lang === 'pt' ? 'pt-BR' : lang);
      assert.equal(response.headers.get('authorization'), null);
      tags[lang] = response.headers.get('etag');
      assert.ok(tags[lang]);
      const before = transferred;
      for (let day = 0; day < 22; day++) {
        response = await request(lang, tags[lang]);
        assert.equal(response.status, 304);
        assert.equal((await response.arrayBuffer()).byteLength, 0);
        assert.equal(response.headers.get('etag'), tags[lang]);
        assert.equal(response.headers.get('cache-control'), 'private, max-age=0, must-revalidate');
      }
      assert.equal(transferred, before, '22 daily reopenings transfer no additional PDF bytes from Storage');
    }
    assert.equal(legacyReads, 0);
    assert.equal(new Set(Object.values(tags)).size, 3);
    const beforeAuth = requests.length;
    for (const lang of ['en', 'es', 'pt']) assert.equal((await request(lang, tags[lang], { user: false })).status, 401);
    assert.equal(requests.length, beforeAuth, 'logged-out conditional requests never reach Storage');

    assert.equal((await request('es', tags.en)).status, 200, 'English version cannot reuse a translated file');
    assert.equal((await request('en', tags.en, { chapter: '3' })).status, 200, 'chapter changes get the correct PDF');
    for (const lang of ['en', 'es', 'pt']) {
      put(lang === 'en' ? 'cp02.pdf' : `${lang}/cp02.pdf`, 'v2');
      const response = await request(lang, tags[lang]);
      assert.equal(response.status, 200, 'replacement is delivered on the very next reopening');
      assert.notEqual(response.headers.get('etag'), tags[lang]);
      tags[lang] = response.headers.get('etag');
      assert.match(await response.text(), /v2$/);
    }
    assert.equal((await request('en', `W/${tags.en}`)).status, 304);
    assert.equal((await request('en', `"old", ${tags.en}`)).status, 304);
    assert.equal((await request('en', '*')).status, 304);
    omit304Etag = true;
    assert.equal((await request('en', tags.en)).headers.get('etag'), tags.en);
    omit304Etag = false;

    const beforeInvalid = requests.length;
    for (const lang of ['fr', '../en', 'ES', '']) assert.equal((await request(lang)).status, 400);
    assert.equal((await request('en', tags.en, { chapter: '41' })).status, 404);
    assert.equal(requests.length, beforeInvalid);
    for (const lang of ['es', 'pt']) {
      objects.delete(privateUrl(`${lang}/cp02.pdf`));
      assert.equal((await request(lang, tags[lang])).status, 404, 'deleted translations cannot reuse cached content');
    }
    assert.equal(legacyReads, 0, 'translations never fall back to English');
    objects.delete(privateUrl('cp02.pdf'));
    legacyUrl = 'https://legacy.test/cp02.pdf';
    objects.set(legacyUrl, { etag: '"legacy-v1"', body: '%PDF-legacy-v1' });
    let response = await request('en', tags.en);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '%PDF-legacy-v1');
    assert.equal(response.headers.get('etag'), '"legacy-v1"');
    const beforeLegacy = transferred;
    assert.equal((await request('en', '"legacy-v1"')).status, 304);
    assert.equal(transferred, beforeLegacy, 'legacy files also support zero-byte revalidation');
    put('cp02.pdf', 'v3');
    response = await request('en', '"legacy-v1"');
    assert.equal(response.status, 200, 'a new private upload supersedes the cached legacy copy');
    assert.match(await response.text(), /v3$/);
    statusOverride = 503;
    assert.notEqual((await request('en', '"cp02.pdf-v3"')).status, 304, 'upstream errors never validate stale cached content');
    console.log('PASS: 66 daily reopenings without PDF transfers; automatic updates; chapter/language separation; auth-before-cache; deleted files; conditional headers; private and legacy sources; credentials stay server-side.');
  } finally {
    cleanup(); global.fetch = originalFetch; delete global.__textbookStorage;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
}
module.exports = { buildRoute };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
