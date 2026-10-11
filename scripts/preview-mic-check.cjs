// Public-asset preview. No student data or production writes.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../public');
function createServer() {return http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){res.writeHead(302,{Location:'/games/midway-mic-check.html'});return res.end();}
  if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(url.pathname==='/api/avatar/me'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({setup_completed:false,traits:null,equipped:{},equipped_items:[]}));}
  if(url.pathname==='/api/arcade/mic-check/context'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({unlockedThrough:8,preferredUnit:'unit-1'}));}
  if(url.pathname!=='/games/midway-mic-check.html'&&!/^\/games\/mic-check\/(?:[a-z-]+\.(css|js)|vocals\/[a-z0-9-]+\.(wav|json))$/.test(url.pathname)){res.writeHead(404);return res.end();}
  try{const p=path.join(root,url.pathname),types={'.js':'text/javascript','.css':'text/css','.wav':'audio/wav','.json':'application/json','.html':'text/html'};res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end();}
});}
if(require.main===module)createServer().listen(Number(process.env.PORT||4189),'127.0.0.1',()=>console.log('Mic Check preview: http://127.0.0.1:4189/games/midway-mic-check.html'));
module.exports={createServer};
