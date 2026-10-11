// Isolated local Postgres only. All fixture records and schema roll back.
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),migration=fs.readFileSync(root+'/supabase/migrations/20260929042654_pulse_song_charts.sql','utf8');
const sql=`BEGIN;
DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF; END $$;
CREATE TABLE public.arcade_plays(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,game_slug text,status text DEFAULT 'active',score integer DEFAULT 0,meta jsonb DEFAULT '{}',created_at timestamptz DEFAULT now());
CREATE TABLE public.pulse_test_charges(user_id uuid);
CREATE FUNCTION public.purchase_arcade_play(p_user_id uuid,p_email text,p_slug text,p_staff boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql AS $$ DECLARE id uuid; BEGIN
INSERT INTO public.pulse_test_charges VALUES(p_user_id);
INSERT INTO public.arcade_plays(user_id,game_slug,meta) VALUES(p_user_id,p_slug,CASE WHEN p_staff THEN '{"staff":true}'::jsonb ELSE '{}'::jsonb END) RETURNING arcade_plays.id INTO id;
RETURN jsonb_build_object('playId',id,'costXp',10,'balance',90,'staff',p_staff);
END $$;
${migration}\n${migration}
DO $$ DECLARE result jsonb; n integer; BEGIN
result:=public.purchase_pulse_play('00000000-0000-0000-0000-000000000001','fixture@example.test','terminal-velocity-overdrive');
ASSERT result->>'chartId'='terminal-velocity-overdrive';
ASSERT (SELECT meta->>'pulseChart'='terminal-velocity-overdrive' FROM public.arcade_plays WHERE id=(result->>'playId')::uuid);
BEGIN PERFORM public.purchase_pulse_play('00000000-0000-0000-0000-000000000001','fixture@example.test','invalid'); RAISE EXCEPTION 'accepted invalid chart'; EXCEPTION WHEN OTHERS THEN ASSERT SQLERRM='INVALID_PULSE_CHART'; END;
ASSERT (SELECT count(*)=1 FROM public.pulse_test_charges);
-- A metadata failure must roll back the credit and new play, together.
ALTER TABLE public.arcade_plays ADD CONSTRAINT reject_solar CHECK (meta->>'pulseChart' IS DISTINCT FROM 'solar-flare-master');
BEGIN PERFORM public.purchase_pulse_play('00000000-0000-0000-0000-000000000001','fixture@example.test','solar-flare-master'); RAISE EXCEPTION 'accepted broken metadata'; EXCEPTION WHEN check_violation THEN NULL; END;
ASSERT (SELECT count(*)=1 FROM public.pulse_test_charges);
ALTER TABLE public.arcade_plays DROP CONSTRAINT reject_solar;
ASSERT NOT has_function_privilege('anon','public.purchase_pulse_play(uuid,text,text,boolean)','EXECUTE');
ASSERT NOT has_function_privilege('authenticated','public.pulse_chart_leaderboard(text,uuid,timestamptz)','EXECUTE');
ASSERT has_function_privilege('service_role','public.purchase_pulse_play(uuid,text,text,boolean)','EXECUTE');
END $$;
-- Beyond the REST 1,000-row default: later users must still rank correctly.
INSERT INTO public.arcade_plays(user_id,game_slug,status,score,meta)
SELECT ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'pulse','finished',100000+i,jsonb_build_object('pulseChart','terminal-velocity-overdrive') FROM generate_series(1,1105) i;
INSERT INTO public.arcade_plays(user_id,game_slug,status,score,meta,created_at) VALUES
('00000000-0000-0000-0000-000000000001','pulse','finished',990000,'{}',now()),
('00000000-0000-0000-0000-000000000002','pulse','finished',999999,'{"staff":true,"pulseChart":"terminal-velocity-overdrive"}',now()),
('00000000-0000-0000-0000-000000000003','pulse','finished',800000,'{"pulseChart":"terminal-velocity-overdrive"}',now()-interval '14 days'),
('00000000-0000-0000-0000-000000001105','pulse','finished',111111,'{"pulseChart":"terminal-velocity-overdrive"}',now());
DO $$ DECLARE result jsonb; BEGIN
result:=public.pulse_chart_leaderboard('terminal-velocity-overdrive','00000000-0000-0000-0000-000000000001',now()-interval '1 day');
ASSERT jsonb_array_length(result->'weekly')=10;
ASSERT result->>'myWeeklyRank'='1105';
ASSERT result->'weekly'->0->>'score'='111111';
ASSERT result->'hallOfFame'->0->>'score'='800000';
ASSERT jsonb_array_length(result->'hallOfFame')=5;
result:=public.pulse_chart_leaderboard('neon-current-arcade','00000000-0000-0000-0000-000000000001',now()-interval '1 day');
ASSERT result->'weekly'->0->>'score'='990000';
ASSERT jsonb_array_length(result->'weekly')=1;
result:=public.pulse_chart_leaderboard('neon-current-master','00000000-0000-0000-0000-000000000001',now()-interval '1 day');
ASSERT result->'weekly'='[]'::jsonb; ASSERT result->'myWeeklyRank'='null'::jsonb;
END $$;
ROLLBACK;`;
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',['-h','127.0.0.1','-p','55439','-d','postgres','-X','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',stdio:['pipe','pipe','pipe']});
console.log('PASS atomic chart/credit binding, invalid chart rejection, rollback on metadata failure, service-only RPC grants, legacy board, separate charts, staff exclusion, per-student best, weekly/all-time, 1,105-player ranking; fixture rolled back');
