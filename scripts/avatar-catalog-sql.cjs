// Validate the inert SVG dialect before generating a catalog publication patch.
// Usage: node scripts/avatar-catalog-sql.cjs [migration-file-created-by-supabase]
// Without a path, validate only. Existing prices and retirement status are kept.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),esbuild=require('esbuild');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'avatar-catalog-'));const out=path.join(dir,'svg.cjs');
esbuild.buildSync({entryPoints:['src/lib/avatar/svg.ts'],bundle:true,platform:'node',format:'cjs',outfile:out});
const {safeSvgLayer}=require(out);const items=JSON.parse(fs.readFileSync('src/data/avatar-catalog.json'));
const slugs=new Set(),slots=new Set(['head','body','eyewear','facial_hair','pin','background']);
const quote=s=>"'"+s.replaceAll("'","''")+"'";
let sql='\n-- Validated versioned avatar artwork; retain established ownership/economics.\n';
for(const i of items){
 if(!/^[a-z0-9-]{1,80}$/.test(i.slug)||slugs.has(i.slug)||!slots.has(i.slot)||!safeSvgLayer(i.svg_layer)||!Number.isInteger(i.z_order)||typeof i.name!=='string')throw Error('Invalid artwork or metadata: '+i.slug);
 slugs.add(i.slug);
 if(i.cost_xp!==null&&(!Number.isInteger(i.cost_xp)||i.cost_xp<0||i.unlock_target_id))throw Error('Invalid eligibility: '+i.slug);
 // Unlock-only items must be created with a semantic target lookup in a reviewed
 // migration. Never bake environment-specific generated target IDs into SQL.
 if(!i.unlock_target_id)sql+=`INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options) VALUES(${quote(i.slug)},${quote(i.slot)},${quote(i.name)},${i.cost_xp??'NULL'},${quote(i.svg_layer)},${i.z_order},${quote(JSON.stringify(i.render_options??{}))}::jsonb) ON CONFLICT(slug) DO NOTHING;\n`;
 sql+=`UPDATE public.avatar_items SET svg_layer=${quote(i.svg_layer)},render_options=${quote(JSON.stringify(i.render_options??{}))}::jsonb WHERE slug=${quote(i.slug)};\n`;
}
if(process.argv[2]){const dest=path.resolve(process.argv[2]);if(!dest.startsWith(path.resolve('supabase/migrations')+path.sep)||!fs.existsSync(dest)||!dest.endsWith('.sql'))throw Error('Pass an existing Supabase migration path');fs.appendFileSync(dest,sql)}
console.log(`Validated ${items.length} catalog items${process.argv[2]?' and appended artwork SQL':''}.`);
