// FHS uniform and headwear review using the production avatar composer.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),sharp=require('sharp');
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('node:module').Module._initPaths();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fhs-art-')),output=path.resolve('docs/avatar-fhs-verification');fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:['src/components/avatar/Avatar.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'avatar.cjs'),jsx:'automatic',external:['react','react/jsx-runtime']});
const Avatar=require(path.join(temp,'avatar.cjs')).default,items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const collection=items.filter(i=>i.slug.startsWith('fhs-')),outfits=collection.filter(i=>i.slot==='body'),headwear=collection.filter(i=>i.slot==='head');
let seq=0;const render=(props={},size=160,crop='full')=>renderToStaticMarkup(React.createElement(Avatar,{traits:{mouth:'smile'},items,...props,size,crop}),{identifierPrefix:'fhs-'+seq++});
const escape=s=>s.replaceAll('&','&amp;');
const skins=['tan','brown','light','deep','olive','pale','dark'];
const hair=['short','bob','fade','side_part','buzz'];
const looks=outfits.map((item,index)=>({label:item.name.replace('FHS ',''),traits:{skin:skins[index%skins.length],hair_style:hair[index%hair.length],mouth:'smile',face:['round','egg','square','heart'][index%4]},equipped:{body:item.slug,...(item.slug==='fhs-football-uniform'?{head:'fhs-football-helmet'}:item.slug==='fhs-hockey-uniform'?{head:'fhs-hockey-helmet'}:['fhs-baseball-uniform','fhs-softball-uniform'].includes(item.slug)?{head:'fhs-baseball-cap'}:{})}}));
const header=`<text x="24" y="37" font-family="Arial" font-size="24" font-weight="bold" fill="#414D5B">FITCHBURG HIGH SCHOOL</text><text x="24" y="60" font-family="Arial" font-size="14" fill="#708090">Crimson &amp; slate · FHS athletics collection</text><rect x="988" y="24" width="42" height="28" rx="6" fill="#9E1B32"/><rect x="1040" y="24" width="42" height="28" rx="6" fill="#708090"/>`;
(async()=>{
 const detailCards=outfits.map((item,i)=>`<g transform="translate(${12+i%5*220} ${82+Math.floor(i/5)*214})"><rect width="208" height="200" rx="16" fill="#FFFFFF"/><svg x="4" y="10" width="200" height="134" viewBox="-52 51 104 70" xmlns="http://www.w3.org/2000/svg">${item.svg_layer}</svg><text x="104" y="179" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#414D5B">${escape(item.name.replace('FHS ',''))}</text></g>`).join('');
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="738"><rect width="1120" height="738" fill="#EDF0F2"/>${header}${detailCards}</svg>`)).png().toFile(path.join(output,'uniform-details.png'));
 const cards=looks.map((look,i)=>`<g transform="translate(${12+i%5*220} ${82+Math.floor(i/5)*292})"><rect width="208" height="278" rx="16" fill="#FFFFFF"/><g transform="translate(24 0)">${render(look)}</g><text x="104" y="251" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#414D5B">${escape(look.label)}</text></g>`).join('');
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="970"><rect width="1120" height="970" fill="#EDF0F2"/>${header}${cards}</svg>`)).png().toFile(path.join(output,'collection.png'));
 const headLooks=headwear.map((item,i)=>({label:item.name,traits:{skin:skins[i],hair_style:'afro'},equipped:{head:item.slug,body:['fhs-baseball-uniform','fhs-football-uniform','fhs-hockey-uniform'][i]}}));
 const headCards=headLooks.map((look,i)=>`<g transform="translate(${16+i*280} 68)"><rect width="264" height="292" rx="17" fill="#FFFFFF"/><g transform="translate(27 5)">${render(look,210,'head')}</g><text x="132" y="263" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#414D5B">${escape(look.label)}</text></g>`).join('');
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="872" height="378"><rect width="872" height="378" fill="#EDF0F2"/><text x="24" y="40" font-family="Arial" font-size="24" font-weight="bold" fill="#414D5B">Matching FHS headwear</text>${headCards}</svg>`)).png().toFile(path.join(output,'headwear.png'));
 let fitCount=0;
 for(const item of headwear)for(const face of ['round','egg','square','heart'])for(const skin of skins){
  const props={equipped:{head:item.slug},traits:{face,skin,hair_style:'afro'}};
  const a=await sharp(Buffer.from(render(props))).ensureAlpha().raw().toBuffer();
  const b=await sharp(Buffer.from(render({...props,traits:{...props.traits,hair_style:'bald'}}))).ensureAlpha().raw().toBuffer();
  if(!a.equals(b))throw Error(`Headwear does not tuck hair consistently: ${item.slug}/${face}/${skin}`);
  fitCount++;
 }
 const gallery=cases=>`<div class="grid">${cases.map(c=>`<article>${render(c,180)}<h2>${escape(c.label)}</h2><span class="circle">${render(c,40,'head')}</span></article>`).join('')}</div>`;
 const fit=headLooks.flatMap(c=>['round','egg','square','heart'].map(face=>({...c,label:`${c.label} / ${face}`,traits:{...c.traits,face}})));
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FHS sports uniform review</title><style>body{margin:24px;background:#edf0f2;color:#414d5b;font:14px system-ui}.grid{display:flex;flex-wrap:wrap;gap:16px}article{padding:16px;background:white;border-radius:16px;text-align:center}.circle{display:inline-flex;border-radius:50%;overflow:hidden;background:#eee}h2{font-size:15px}img{max-width:100%}</style><h1>Fitchburg High School sports collection</h1><p>15 outfits and 3 headwear items. Crimson #9E1B32; slate #708090. Lettering is native vector artwork.</p><img src="uniform-details.png" alt="FHS uniform details">${gallery(looks)}<h1>Headwear fit</h1><p>${fitCount} hair-treatment checks passed.</p>${gallery(fit)}</html>`);
 console.log(`Created ${output}. ${fitCount} headwear/face/skin checks passed.`);
})().catch(e=>{console.error(e);process.exitCode=1});
