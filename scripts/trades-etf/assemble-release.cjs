const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),source='/private/tmp/trades-reset-release',release='/private/tmp/trades-etf-release';
const walk=(nodes,p='')=>nodes.flatMap(n=>n.type==='directory'?walk(n.children,p+n.name+'/'):[{path:p+n.name,hash:n.uid}]);
const baseline=walk(JSON.parse(fs.readFileSync('/private/tmp/trades-reset-uploaded.json'))[0].children);
const sha=b=>crypto.createHash('sha1').update(b).digest('hex');
const overlays=['src/lib/lesson-plan-export.ts','src/app/admin/teacher/plans/page.tsx','src/components/lessons/CaseBoard.tsx','src/components/lessons/CaseBoard.module.css','src/data/trades-etf-plans.json','src/data/trades-etf-units.json','public/trades-reset/index.html','scripts/test-trades-etf.ts','scripts/test-trades-etf-browser.cjs'];
function files(dir){return fs.readdirSync(repo+'/'+dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):[dir+'/'+d.name])}
overlays.push(...files('public/trades-etf'),...files('scripts/trades-etf').filter(f=>!f.includes('__pycache__')));
for(const f of baseline){const b=fs.readFileSync(source+'/'+f.path);if(sha(b)!==f.hash)throw Error('Production source changed: '+f.path);const dest=release+'/'+f.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b)}
for(const f of overlays){fs.mkdirSync(path.dirname(release+'/'+f),{recursive:true});fs.copyFileSync(repo+'/'+f,release+'/'+f)}
fs.mkdirSync(release+'/.vercel',{recursive:true});fs.copyFileSync(repo+'/.vercel/project.json',release+'/.vercel/project.json');
if(!fs.existsSync(release+'/node_modules'))fs.symlinkSync(repo+'/node_modules',release+'/node_modules','dir');
fs.writeFileSync('/private/tmp/trades-etf-release-manifest.json',JSON.stringify({sourceDeployment:'dpl_BeVTCq8R7Kin8fEKrSq75HXXNJPQ',baseline,overlays,changedExisting:overlays.filter(p=>baseline.some(f=>f.path===p))},null,2));
console.log(JSON.stringify({release,verifiedProductionFiles:baseline.length,newFiles:overlays.filter(p=>!baseline.some(f=>f.path===p)).length,changedExisting:overlays.filter(p=>baseline.some(f=>f.path===p))},null,2));
