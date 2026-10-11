// Review seasonal catalog art with the live SVG composer, including mask coverage.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spooky-art-')),output=path.resolve('docs/avatar-spooky-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const slug=s=>'spooky-'+s;
const look=(head,body,pin,eyewear)=>({head:slug(head),body:slug(body),...(pin?{pin:slug(pin)}:{}),...(eyewear?{eyewear:slug(eyewear)}:{})});
const looks=[
 {label:'Moon witch',equipped:look('witch-hat','witch-robe','broom'),traits:{skin:'brown'}},
 {label:'Friendly ghost',equipped:look('ghost-hood','ghost-sheet','lantern')},
 {label:'Smiling skeleton',equipped:look('skull-mask','skeleton-suit','bat-bow-tie')},
 {label:'Jack-o’-lantern',equipped:look('pumpkin-mask','pumpkin-outfit','candy-bucket')},
 {label:'Moonlit mummy',equipped:look('mummy-mask','mummy-wraps')},
 {label:'Moonlight werewolf',equipped:look('werewolf-mask','werewolf-shirt')},
 {label:'Stitched monster',equipped:look('monster-mask','monster-jacket','spider-brooch')},
 {label:'Harvest scarecrow',equipped:look('scarecrow-mask','scarecrow-overalls')},
 {label:'Midnight black cat',equipped:look('cat-hood','cat-suit')},
 {label:'Haunted pirate',equipped:look('pirate-hat','pirate-coat',null,'pirate-eye-patch'),traits:{skin:'olive',mouth:'smirk'}},
];
const extras=items.filter(i=>i.slug.startsWith('spooky-')&&['pin','eyewear','background'].includes(i.slot)).map((i,index)=>({label:i.name,traits:{skin:index%2?'brown':'tan',hair_style:index%2?'bob':'short',shirt_color:'teal'},equipped:i.slot==='background'?{...looks[index%looks.length].equipped,background:i.slug}:{[i.slot]:i.slug}}));
let seq=0;const render=(props={},size=160,crop='full')=>renderToStaticMarkup(React.createElement(Avatar,{traits:{mouth:'smile'},items,...props,size,crop}),{identifierPrefix:'spooky-'+seq++});
const escape=s=>s.replaceAll('&','&amp;');
const sheet=async(cases,title,name)=>{
 const width=1120,cellW=220,cellH=316,height=82+Math.ceil(cases.length/5)*cellH;
 const cards=cases.map((c,i)=>`<g transform="translate(${12+i%5*cellW} ${70+Math.floor(i/5)*cellH})"><rect width="208" height="302" rx="18" fill="#FFFFFF"/><g transform="translate(14 7)">${render(c,180)}</g><text x="104" y="275" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#403649">${escape(c.label)}</text></g>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#F0EAF2"/><text x="24" y="43" font-family="Arial" font-size="26" font-weight="bold" fill="#403649">${escape(title)}</text>${cards}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(path.join(output,name));
};
(async()=>{
 const masks=items.filter(i=>i.slug.startsWith('spooky-')&&i.slot==='head'&&i.render_options?.hair==='hide');
 let coverage=0;
 for(const item of masks){
  const equipped={head:item.slug};
  const baseline=await sharp(Buffer.from(render({equipped,traits:{face:'round',skin:'pale',hair_style:'bald'}}))).ensureAlpha().raw().toBuffer();
  for(const face of ['round','egg','square','heart'])for(const skin of ['pale','light','tan','olive','brown','deep','dark']){
   const data=await sharp(Buffer.from(render({equipped,traits:{face,skin,hair_style:'afro'}}))).ensureAlpha().raw().toBuffer();
   if(!data.equals(baseline))throw Error(`Base face or hair leaks through ${item.slug}: ${face}/${skin}.`);
   coverage++;
  }
 }
 await sheet(looks,'Spooky season · ten mix-and-match costumes','collection.png');
 await sheet(extras,'Spooky extras · props, accessories & backgrounds','extras.png');
 const fit=looks.flatMap(c=>['round','egg','square','heart'].map(face=>({label:`${c.label} / ${face}`,equipped:c.equipped,traits:{face,skin:'deep',hair_style:'afro'}})));
 const section=cases=>`<div class="grid">${cases.map(c=>`<article>${render(c)}<h2>${escape(c.label)}</h2><span class="circle">${render(c,40,'head')}</span></article>`).join('')}</div>`;
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spooky season artwork review</title><style>body{margin:24px;background:#f0eaf2;color:#403649;font:14px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{padding:16px;background:white;border-radius:16px;text-align:center}.circle{display:inline-flex;border-radius:50%;overflow:hidden;background:#eee9f1}h2{font-size:15px}</style><h1>Spooky season wardrobe collection</h1><p>30 new items. ${coverage} complete-mask coverage checks passed.</p>${section(looks)}<h1>Accessories and backgrounds</h1>${section(extras)}<h1>Face shape and compact portrait review</h1>${section(fit)}</html>`);
 console.log(`Created ${output}. All ${coverage} mask/face/skin coverage checks passed.`);
})().catch(e=>{console.error(e);process.exitCode=1});
