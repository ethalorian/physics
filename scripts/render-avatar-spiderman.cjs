// Before/after art review with the production composer; also checks cowl coverage.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spiderman-art-')),output=path.resolve('docs/avatar-spiderman-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const before=JSON.parse(fs.readFileSync(path.join(output,'before.json')));
const equipped={head:'spiderman-mask',body:'spiderman-suit'};
let seq=0;const render=(props,size=205,crop='full')=>renderToStaticMarkup(React.createElement(Avatar,{traits:{},equipped,items,...props,size,crop}),{identifierPrefix:'spiderman-'+seq++});
const cases=[
 {label:'Previous artwork',props:{items:before}},
 {label:'Upgraded mask + suit',props:{}},
 {label:'Suit on its own',props:{traits:{skin:'brown',hair_style:'short'},equipped:{body:'spiderman-suit'}}},
 {label:'Mask detail',props:{},crop:'head'},
];
const cards=cases.map((c,i)=>`<g transform="translate(${16+i*248} 74)"><rect width="232" height="351" rx="17" fill="#FFFFFF"/><g transform="translate(13 ${c.crop==='head'?37:0})">${render(c.props,205,c.crop)}</g><text x="116" y="316" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#263247">${c.label.replaceAll('&','&amp;')}</text>${i===1?`<g transform="translate(181 266)">${render(c.props,35,'head')}</g>`:''}</g>`).join('');
const preview=`<svg xmlns="http://www.w3.org/2000/svg" width="1008" height="446"><rect width="1008" height="446" fill="#EDF0F5"/><text x="24" y="43" font-family="Arial" font-size="25" font-weight="bold" fill="#263247">Spider-Man wardrobe upgrade</text>${cards}</svg>`;
(async()=>{
 const baseline=await sharp(Buffer.from(render({},160))).raw().toBuffer();
 const fit=[];
 for(const face of ['round','egg','square','heart'])for(const skin of ['pale','light','tan','olive','brown','deep','dark']){
  const props={traits:{face,skin,hair_style:'afro'}};
  const pixels=await sharp(Buffer.from(render(props,160))).raw().toBuffer();
  if(!baseline.equals(pixels))throw Error(`Mask coverage differs for ${face}/${skin}; inspect for exposed base face.`);
  fit.push(`<article>${render(props,120)}<p>${face} / ${skin}</p>${render(props,40,'head')}</article>`);
 }
 await sharp(Buffer.from(preview)).png().toFile(path.join(output,'before-after.png'));
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spider-Man artwork review</title><style>body{margin:24px;background:#edf0f5;color:#263247;font:14px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{padding:16px;background:white;border-radius:16px;text-align:center}h2{font-size:17px}</style><h1>Spider-Man wardrobe upgrade</h1><div class="grid">${cases.map(c=>`<article>${render(c.props,205,c.crop)}<h2>${c.label.replaceAll('&','&amp;')}</h2></article>`).join('')}</div><h2>Coverage across faces and skin tones</h2><div class="grid">${fit.join('')}</div></html>`);
 console.log(`Preview: ${output}. All 28 face/skin combinations have complete mask coverage.`);
})().catch(e=>{console.error(e);process.exitCode=1});
