const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const publicRoot = path.resolve(__dirname, '../public');
function createServer() {
  return http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://local').pathname;
    if (pathname === '/') { res.writeHead(302, { Location:'/games/cut-and-fit/index.html' }); return res.end(); }
    const file = path.resolve(publicRoot, '.' + pathname);
    if (!file.startsWith(path.join(publicRoot, 'games') + path.sep)) { res.writeHead(404); return res.end(); }
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404); res.end(); }
  });
}
module.exports = { createServer };
if (require.main === module) {
  const port = Number(process.env.PORT || 3186);
  createServer().listen(port, '127.0.0.1', () => console.log(`Cut & Fit preview: http://127.0.0.1:${port}/games/cut-and-fit/index.html`));
}
