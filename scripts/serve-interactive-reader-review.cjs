// Local draft viewer. Sample artwork only; no API or student-record access.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const directory = process.argv[2] && path.resolve(process.argv[2]);
if (!directory) throw new Error('Provide the directory exported by build-interactive-reader-review.cjs.');
const publicRoot = path.resolve(__dirname, '../public');
const port = Number(process.env.READER_REVIEW_PORT || 4327);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const base = pathname.startsWith('/avatar/') ? publicRoot : directory;
  const file = path.resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404).end('Not found in this local review.'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  });
}).listen(port, '127.0.0.1', () => console.log(`Reader review: http://127.0.0.1:${port}`));
