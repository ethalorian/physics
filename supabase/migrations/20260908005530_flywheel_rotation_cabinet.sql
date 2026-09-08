-- Deploy the HTML and /games/flywheel/* before enabling in /admin/arcade.
INSERT INTO public.arcade_games
 (slug,name,blurb,src_path,cost_xp,unit,accent,max_plausible_score,enabled,sort_order)
VALUES
 ('flywheel','FLYWHEEL','Move cargo to control spin. Conserve angular momentum, compare disk and ring inertia, and use torque to dock six shuttles.',
 '/games/rotation-flywheel.html',0,'Rotational Motion','#ffc96b',17000,false,13)
ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,
 src_path=EXCLUDED.src_path,unit=EXCLUDED.unit,accent=EXCLUDED.accent,
 max_plausible_score=EXCLUDED.max_plausible_score;
