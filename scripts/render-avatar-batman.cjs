// Review the Batman collection with the same composer used by the live wardrobe.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'batman-art-')),output=path.resolve('docs/avatar-batman-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const equipped={head:'batman-cowl',body:'batman-suit',pin:'batarang'};
let seq=0;const render=(props={},size=205,crop='full')=>renderToStaticMarkup(React.createElement(Avatar,{traits:{mouth:'neutral'},equipped,items,...props,size,crop}),{identifierPrefix:'batman-'+seq++});
const cases=[
 {label:'Cowl, suit & Batarang',props:{}},
 {label:'Suit with cape & belt',props:{traits:{skin:'brown',hair_style:'short',mouth:'smirk'},equipped:{body:'batman-suit'}}},
 {label:'Cowl detail',props:{},crop:'head'},
 {label:'Belt on any outfit',props:{traits:{skin:'olive',hair_style:'bob',shirt_color:'purple',mouth:'smile'},equipped:{pin:'batman-utility-belt'}}},
];
const escape=s=>s.replaceAll('&','&amp;');
const cards=cases.map((c,i)=>`<g transform="translate(${16+i*248} 74)"><rect width="232" height="351" rx="17" fill="#FFFFFF"/><g transform="translate(13 ${c.crop==='head'?37:0})">${render(c.props,205,c.crop)}</g><text x="116" y="316" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#263247">${escape(c.label)}</text>${i===2?`<g transform="translate(181 266)">${render(c.props,35,'head')}</g>`:''}</g>`).join('');
const preview=`<svg xmlns="http://www.w3.org/2000/svg" width="1008" height="446"><rect width="1008" height="446" fill="#EDF0F5"/><text x="24" y="43" font-family="Arial" font-size="25" font-weight="bold" fill="#263247">Batman wardrobe collection</text>${cards}</svg>`;
(async()=>{
 const baseline=await sharp(Buffer.from(render({traits:{skin:'pale',face:'round',mouth:'neutral'}},320))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const fit=[];
 for(const face of ['round','egg','square','heart'])for(const skin of ['pale','light','tan','olive','brown','deep','dark']){
  const props={traits:{face,skin,hair_style:'afro',mouth:'neutral'}};
  const {data,info}=await sharp(Buffer.from(render(props,320))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Only the intentional lower-face opening may reveal skin or shifted features.
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const vx=x/2-80,vy=y/2-102;
   if(vx>=-27&&vx<=27&&vy>=11&&vy<=46)continue;
   const p=(y*info.width+x)*4;
   for(let channel=0;channel<4;channel++)if(Math.abs(data[p+channel]-baseline.data[p+channel])>2)throw Error(`Unexpected cowl exposure for ${face}/${skin} at ${vx},${vy}.`);
  }
  fit.push(`<article>${render(props,120)}<p>${face} / ${skin}</p>${render(props,40,'head')}</article>`);
 }
 await sharp(Buffer.from(preview)).png().toFile(path.join(output,'collection.png'));
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Batman artwork review</title><style>body{margin:24px;background:#edf0f5;color:#263247;font:14px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{padding:16px;background:white;border-radius:16px;text-align:center}h2{font-size:17px}</style><h1>Batman wardrobe collection</h1><div class="grid">${cases.map(c=>`<article>${render(c.props,205,c.crop)}<h2>${escape(c.label)}</h2></article>`).join('')}</div><h2>Cowl fit across all face shapes and skin tones</h2><div class="grid">${fit.join('')}</div></html>`);
 console.log(`Preview: ${output}. All 28 face/skin combinations keep skin inside the intended jaw opening.`);
})().catch(e=>{console.error(e);process.exitCode=1});
