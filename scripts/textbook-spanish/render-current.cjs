// Render only stale chapters, with isolated output directories per worker.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const work = process.argv[2], output = process.argv[3];
if (!work || !output) throw new Error('Pass work and output directories');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const renderer = path.join(__dirname, 'render.py'), rendererHash = sha(fs.readFileSync(renderer));
const python = '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const pending = [];
for (let chapter = 2; chapter <= 40; chapter++) {
  const name = `cp${String(chapter).padStart(2, '0')}`;
  let current = false;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(output, name + '.manifest.json')));
    current = manifest.rendererHash === rendererHash && manifest.pdfSha256 === sha(fs.readFileSync(path.join(output, name + '.pdf'))) && manifest.inputs.every(i => i.sha256 && i.sha256 === sha(fs.readFileSync(path.join(work, i.file))));
  } catch {}
  if (!current) pending.push({ chapter, name });
}
console.log(`Rendering ${pending.length} stale chapters; ${39 - pending.length} already current.`);
async function worker() {
  while (pending.length) {
    const { chapter, name } = pending.shift();
    const temporary = path.join(output, '.render-' + name);
    fs.mkdirSync(temporary, { recursive: true });
    const logPath = '/private/tmp/textbook-spanish-' + name + '-render.log';
    const log = fs.openSync(logPath, 'w');
    const code = await new Promise((resolve, reject) => {
      const child = spawn(python, [renderer, work, temporary, '--chapter', String(chapter), '--require-labels'], { env: { ...process.env, PYTHONPATH: '/private/tmp/textbook-spanish-python' }, stdio: ['ignore', log, log] });
      child.once('error', reject); child.once('close', resolve);
    });
    fs.closeSync(log);
    if (code !== 0) throw new Error(`${name} failed; inspect ${logPath}`);
    const manifest = JSON.parse(fs.readFileSync(path.join(temporary, name + '.manifest.json')));
    if (manifest.rendererHash !== rendererHash) throw new Error('Renderer changed during run');
    for (const file of fs.readdirSync(temporary).filter(f => f.startsWith(name + '.') && !f.endsWith('.manifest.json'))) fs.renameSync(path.join(temporary, file), path.join(output, file));
    fs.renameSync(path.join(temporary, name + '.manifest.json'), path.join(output, name + '.manifest.json'));
    console.log(`Rendered chapter ${chapter}`);
  }
}
Promise.all(Array.from({ length: 3 }, worker)).catch(e => { console.error(e.message); process.exitCode = 1; });
