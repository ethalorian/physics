// Reproducible Thor artwork review with the production avatar composer.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'thor-art-')),output=path.resolve('docs/avatar-thor-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const before=JSON.parse(fs.readFileSync(path.join(output,'before.json'))),equipped={head:'viking-helmet',body:'thor-suit',pin:'mjolnir'};
let seq=0;const render=(props={},size=205,crop='full')=>renderToStaticMarkup(React.createElement(Avatar,{traits:{mouth:'smile'},equipped,items,...props,size,crop}),{identifierPrefix:'thor-'+seq++});
const cases=[
 {label:'Helmet, armor & Mjölnir',props:{}},
 {label:'Armor with red cape',props:{traits:{skin:'brown',hair_style:'braids',mouth:'smirk'},equipped:{body:'thor-suit'}}},
 {label:'Refined winged helmet',props:{equipped:{head:'viking-helmet'}},crop:'head'},
 {label:'Hammer on any outfit',props:{traits:{skin:'olive',hair_style:'bob',shirt_color:'purple',mouth:'smile'},equipped:{pin:'mjolnir'}}},
];
const escape=s=>s.replaceAll('&','&amp;');
const cards=cases.map((c,i)=>`<g transform="translate(${16+i*248} 74)"><rect width="232" height="351" rx="17" fill="#FFFFFF"/><g transform="translate(13 ${c.crop==='head'?37:0})">${render(c.props,205,c.crop)}</g><text x="116" y="316" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#263247">${escape(c.label)}</text>${i===2?`<g transform="translate(181 266)">${render(c.props,35,'head')}</g>`:''}</g>`).join('');
const preview=`<svg xmlns="http://www.w3.org/2000/svg" width="1008" height="446"><rect width="1008" height="446" fill="#EDF0F5"/><text x="24" y="43" font-family="Arial" font-size="25" font-weight="bold" fill="#263247">Thor wardrobe collection</text>${cards}</svg>`;
(async()=>{
 const fit=[];
 for(const face of ['round','egg','square','heart'])for(const skin of ['pale','light','tan','olive','brown','deep','dark']){
  const props={traits:{face,skin,hair_style:'afro',mouth:'smile'}};
  const data=await sharp(Buffer.from(render(props,160))).ensureAlpha().raw().toBuffer();
  const bald=await sharp(Buffer.from(render({...props,traits:{...props.traits,hair_style:'bald'}},160))).ensureAlpha().raw().toBuffer();
  if(!data.equals(bald))throw Error(`Helmet does not tuck hair consistently: ${face}/${skin}.`);
  fit.push(`<article>${render(props,120)}<p>${face} / ${skin}</p><span class="circle">${render(props,40,'head')}</span></article>`);
 }
 await sharp(Buffer.from(preview)).png().toFile(path.join(output,'collection.png'));
 const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="310"><rect width="520" height="310" fill="#EDF0F5"/><g transform="translate(20 10)">${render({items:before,equipped:{head:'viking-helmet'}},225,'head')}</g><g transform="translate(275 10)">${render({equipped:{head:'viking-helmet'}},225,'head')}</g><text x="130" y="275" text-anchor="middle" font-family="Arial" font-size="17" fill="#263247">Previous helmet</text><text x="390" y="275" text-anchor="middle" font-family="Arial" font-size="17" fill="#263247">Refined helmet</text></svg>`;
 await sharp(Buffer.from(comparison)).png().toFile(path.join(output,'helmet-before-after.png'));
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thor artwork review</title><style>body{margin:24px;background:#edf0f5;color:#263247;font:14px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{padding:16px;background:white;border-radius:16px;text-align:center}.circle{display:inline-flex;border-radius:50%;overflow:hidden;background:#eef1f4}h2{font-size:17px}</style><h1>Thor wardrobe collection</h1><div class="grid">${cases.map(c=>`<article>${render(c.props,205,c.crop)}<h2>${escape(c.label)}</h2></article>`).join('')}</div><h2>Helmet before and after</h2><img src="helmet-before-after.png" alt="Thor helmet before and after refinement"><h2>Fit across face shapes and skin tones</h2><div class="grid">${fit.join('')}</div></html>`);
 console.log(`Preview: ${output}. Helmet hair treatment verified for all 28 face/skin combinations.`);
})().catch(e=>{console.error(e);process.exitCode=1});
