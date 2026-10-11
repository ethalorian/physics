const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../public/games/centerpoint');
function createServer(){return http.createServer((req,res)=>{
  const p=new URL(req.url,'http://local').pathname;
  const name=p==='/'?'index.html':p.replace(/^\/games\/centerpoint\//,'').replace(/^\//,'');
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
  try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});}
module.exports={createServer};
if(require.main===module)createServer().listen(Number(process.env.PORT||3187),'127.0.0.1',()=>console.log('Dead Center preview: http://127.0.0.1:'+(process.env.PORT||3187)));
