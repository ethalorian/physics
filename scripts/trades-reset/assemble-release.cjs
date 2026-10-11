const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'../..'),source='/private/tmp/reading-visual-release',release='/private/tmp/trades-reset-release';
const walk=(nodes,p='')=>nodes.flatMap(n=>n.type==='directory'?walk(n.children,p+n.name+'/'):[{path:p+n.name,hash:n.uid}]);
const baseline=walk(JSON.parse(fs.readFileSync('/private/tmp/reading-visual/uploaded.json'))[0].children);
const sha=b=>crypto.createHash('sha1').update(b).digest('hex');
const overlay=['src/components/lessons/TradesWorkshop.module.css','src/components/lessons/CaseBoard.tsx','src/components/lessons/CaseBoard.module.css','src/data/content-blocks.ts','src/components/lessons/TradesWorkshopView.tsx','src/lib/lesson-plan-export.ts','src/app/admin/teacher/plans/page.tsx','src/data/trades-reset-plans.json','src/data/trades-reset-units.json','scripts/test-trades-reset.ts'];
function files(dir){return fs.readdirSync(repo+'/'+dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):[dir+'/'+d.name])}
overlay.push(...files('public/trades-reset'),...files('scripts/trades-reset').filter(f=>!f.includes('__pycache__')&&!f.endsWith('assemble-release.cjs')));
for(const optional of ['scripts/test-trades-reset-browser.cjs','docs/TRADES_RESET_2026-09-21.md'])if(fs.existsSync(repo+'/'+optional))overlay.push(optional);
fs.mkdirSync(release,{recursive:true});
for(const f of baseline){const b=fs.readFileSync(source+'/'+f.path);if(sha(b)!==f.hash)throw Error('Baseline changed '+f.path);const dest=release+'/'+f.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b)}
for(const f of overlay){fs.mkdirSync(path.dirname(release+'/'+f),{recursive:true});fs.copyFileSync(repo+'/'+f,release+'/'+f)}
fs.mkdirSync(release+'/.vercel',{recursive:true});fs.copyFileSync(repo+'/.vercel/project.json',release+'/.vercel/project.json');
if(!fs.existsSync(release+'/node_modules'))fs.symlinkSync(repo+'/node_modules',release+'/node_modules','dir');
fs.writeFileSync('/private/tmp/trades-reset-release-manifest.json',JSON.stringify({sourceDeployment:'dpl_9oMWygf3HXDsaMjy9jWuggzKFz69',baseline,overlay},null,2));
console.log(JSON.stringify({release,baseline:baseline.length,overlays:overlay.length,changedExisting:overlay.filter(p=>baseline.some(f=>f.path===p))},null,2));
