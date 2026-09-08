// Standalone local practice preview. No credentials, API proxy, or write routes.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../public');
const server=http.createServer((request,response)=>{
  const name=new URL(request.url,'http://localhost').pathname;
  const allowed=['/games/rotation-tether.html','/games/tether/physics.js','/games/tether/levels.js','/games/tether/game.js'];
  if(!allowed.includes(name)){response.writeHead(404);return response.end('Not found')}
  response.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');response.setHeader('Cache-Control','no-store');
  response.end(fs.readFileSync(path.join(root,name)));
});
server.listen(0,'127.0.0.1',()=>console.log(`Tether practice: http://127.0.0.1:${server.address().port}/games/rotation-tether.html`));
