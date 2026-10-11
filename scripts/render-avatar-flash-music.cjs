// Review new catalog artwork with the production avatar composer.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'flash-music-art-')),output=path.resolve('docs/avatar-flash-music-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const looks=[
 {label:'Flash suit',traits:{skin:'tan',hair_style:'spiky',hair_color:'brown'},equipped:{body:'flash-suit'}},
 {label:'Flash mask + suit',traits:{skin:'brown',face:'heart',mouth:'smile'},equipped:{head:'flash-mask',body:'flash-suit'}},
 {label:'Piccolo over clothing',traits:{skin:'light',hair_style:'bob',hair_color:'black'},equipped:{body:'denim-jacket',pin:'piccolo',eyewear:'half-rim-glasses'}},
 {label:'Black half-rim glasses',traits:{skin:'tan',face:'egg',hair_style:'short',eyes:'big'},equipped:{eyewear:'half-rim-glasses'},crop:'head'},
];
let seq=0;const render=(look,size=180,crop=look.crop??'full')=>renderToStaticMarkup(React.createElement(Avatar,{...look,items,size,crop}),{identifierPrefix:'flash-'+seq++});
const escape=s=>s.replaceAll('&','&amp;');
const cards=looks.map((look,i)=>`<g transform="translate(${16+i*244} 76)"><rect width="228" height="320" rx="16" fill="#FFFFFF"/><g transform="translate(24 ${look.crop==='head'?42:8})">${render(look)}</g><text x="114" y="285" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#30283F">${escape(look.label)}</text></g>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="992" height="414"><rect width="992" height="414" fill="#F2ECF0"/><text x="24" y="43" font-family="Arial" font-size="25" font-weight="bold" fill="#30283F">New in the avatar wardrobe</text>${cards}</svg>`;
const fit=[];
for(const skin of ['pale','light','tan','olive','brown','deep','dark'])for(const face of ['round','egg','square','heart'])fit.push({label:`Flash / ${skin} / ${face}`,traits:{skin,face,hair_style:'afro'},equipped:{head:'flash-mask',body:'flash-suit'}});
for(const face of ['round','egg','square','heart'])for(const eye_spacing of ['close','normal','wide'])fit.push({label:`Glasses / ${face} / ${eye_spacing}`,traits:{face,eye_spacing,eyes:'wide',eye_scale:'large'},equipped:{eyewear:'half-rim-glasses'},crop:'head'});
for(const body of items.filter(i=>i.slot==='body'))fit.push({label:`Piccolo / ${body.name}`,traits:{skin:'brown'},equipped:{body:body.slug,pin:'piccolo'}});
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flash, piccolo and glasses preview</title><style>body{margin:24px;background:#f2ecf0;color:#30283f;font:15px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{background:white;border-radius:16px;padding:16px;text-align:center}h2{font-size:16px}p{max-width:200px}</style><h1>New avatar items</h1><div class="grid">${looks.map(l=>`<article>${render(l)}<h2>${escape(l.label)}</h2></article>`).join('')}</div><h2>Skin, face, eye spacing, and clothing fit</h2><div class="grid">${fit.map(l=>`<article>${render(l,130)}<p>${escape(l.label)}</p></article>`).join('')}</div></html>`;
(async()=>{await sharp(Buffer.from(svg)).png().toFile(path.join(output,'collection.png'));fs.writeFileSync(path.join(output,'index.html'),html);console.log(`Preview and ${fit.length} fit cases: ${output}`);})().catch(e=>{console.error(e);process.exitCode=1});
