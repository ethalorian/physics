// An isolated temporary PostgreSQL database is required. Never point this fixture at production.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const initial=fs.readFileSync(root+'/supabase/migrations/20260609_create_arcade_cabinet.sql','utf8');
const ddl=initial.match(/CREATE TABLE IF NOT EXISTS public\.arcade_games \([\s\S]*?\n\);/)[0];
const seed=fs.readFileSync(root+'/supabase/migrations/20260928030421_add_pulse_cabinet.sql','utf8');
const sql=`BEGIN; ${ddl}\n${seed}\n${seed}\nSELECT row_to_json(g) FROM public.arcade_games g WHERE slug='pulse'; ROLLBACK;`;
const output=execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',['-h','127.0.0.1','-p','55439','-d','postgres','-X','-A','-t','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8'});
const rows=output.split('\n').filter(l=>l.startsWith('{')).map(JSON.parse);assert.equal(rows.length,1);
const row=rows[0];assert.equal(row.slug,'pulse');assert.equal(row.enabled,false);assert.equal(row.cost_xp,10);assert.equal(row.max_plausible_score,1000000);assert.equal(row.unit,'Midway');assert.equal(row.src_path,'/games/midway-pulse.html');
console.log('PASS Pulse SQL registration against original arcade schema: disabled, 10 XP, 1,000,000 cap, idempotent insert; rolled back');
