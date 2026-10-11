// Standalone practice preview. Only public Pulse files are served; no student data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') { res.writeHead(302, { Location: '/games/midway-pulse.html' }); return res.end(); }
    const pathname = url.pathname;
    if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    if (pathname !== '/games/midway-pulse.html' && !/^\/games\/pulse\/[a-z-]+\.(css|js)$/.test(pathname)) { res.writeHead(404); return res.end(); }
    try {
      const file = path.join(root, pathname);
      res.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : 'text/html');
      res.setHeader('Cache-Control', 'no-store'); res.end(fs.readFileSync(file));
    } catch { res.writeHead(404); res.end(); }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 4187);
  createServer().listen(port, '127.0.0.1', () => console.log(`Pulse preview: http://127.0.0.1:${port}/games/midway-pulse.html`));
}
module.exports = { createServer };
