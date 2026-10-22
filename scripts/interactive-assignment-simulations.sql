-- Additive registration only. Does not assign classes or alter student work.
begin;
insert into public.interactive_assignment_templates(slug,day,title,target_slugs) values
('simulation-measurement-precision',2,'Measurement Lab · Can a precise measurement still be wrong?',ARRAY['foundations.measurement-precision']),
('simulation-distance-displacement',2,'Out & Back · What changes when you turn around?',ARRAY['u1.vocab-position-distance-displacement']),
('simulation-constant-velocity',3,'Motion Studio · Does changing the origin change the motion?',ARRAY['u1.capture-pt-graph','u1.vocab-position-distance-displacement']),
('simulation-race-track',3,'Race Track · A full lap. How far did you go?',ARRAY['u1.vocab-position-distance-displacement']),
('simulation-slope-calculator',3,'Slope Detective · Is a high point on the graph a high speed?',ARRAY['u1.capture-pt-graph']),
('simulation-area-under-curve',4,'Signed Area Lab · Can you travel far and end where you began?',ARRAY['u1.read-vt-graph-components','u1.vocab-position-distance-displacement']),
('simulation-asteroid-trajectory',4,'Trajectory Reader · Is an asteroid’s distance from Earth the same as its x position?',ARRAY['u1.read-vt-graph-components','u1.predict-position-uncertainty']),
('simulation-car-race',5,'Catch-Up Challenge · When does a faster car actually catch up?',ARRAY['u1.predict-position-uncertainty']),
('simulation-closing-speed',6,'Closing Speed · Does all of an asteroid’s speed bring it closer?',ARRAY['u1.vectors-tip-to-tail','u1.read-vt-graph-components']),
('simulation-maze-vectors',6,'Vector Routes · Do different routes lead to the same displacement?',ARRAY['u1.vectors-tip-to-tail','u1.vocab-position-distance-displacement']),
('simulation-uniformly-accelerated-motion',7,'Acceleration Studio · Can positive velocity go with negative acceleration?',ARRAY['u1.acceleration-rate-of-change','u1.pick-equation-of-motion']),
('simulation-freefall-cliff',8,'Cliff Drop · What can fall time tell you about height?',ARRAY['u1.pick-equation-of-motion','u1.acceleration-rate-of-change']),
('simulation-vacuum-chamber',8,'Vacuum Chamber · Why does mass matter in air but not in a vacuum?',ARRAY['u1.pick-equation-of-motion','u1.fma-solve-net-force']),
('simulation-astronaut-thrust',9,'Thrust & Coast · What happens after the engine switches off?',ARRAY['u1.newtons-first-law-inertia','u1.fma-solve-net-force']),
('simulation-force-mass',11,'Force & Mass Lab · What does a fair test of F = ma look like?',ARRAY['u1.lab-accel-vs-mass','u1.lab-accel-vs-force','u1.fma-solve-net-force']),
('simulation-carts-third-law',14,'Spring Carts · Equal forces—so why do the carts move differently?',ARRAY['u1.third-law-pairs','u1.fma-solve-net-force']),
('simulation-free-body-diagram',15,'Force Inspector · Which forces belong on this object’s diagram?',ARRAY['u1.identify-forces','u1.draw-fbd','u1.net-force-from-fbd']),
('simulation-sumo-forces',16,'Force Tug-of-War · Do balanced forces mean the object must be stopped?',ARRAY['u1.net-force-from-fbd','u1.newtons-first-law-inertia']),
('simulation-incline-lab',16,'Tilted Axes · Why does the normal force change on a ramp?',ARRAY['u1.d17-incline-components','u1.draw-fbd','u1.equilibrium-find-unknown']),
('simulation-friction-lab',17,'Grip & Slip · Why is it harder to start sliding than to keep sliding?',ARRAY['u1.friction-static-kinetic','u1.net-force-from-fbd']),
('simulation-atwood-machine',18,'Pulley Balance · When does tension equal weight?',ARRAY['u1.equilibrium-find-unknown','u1.net-force-from-fbd']),
('simulation-predicting-2026-xj',20,'Prediction Envelope · How confident should we be in a distant prediction?',ARRAY['u1.predict-position-uncertainty']),
('simulation-riverboat-crossing',6,'River Crossing · Can pointing upstream make the crossing take longer?',ARRAY['u1.vectors-tip-to-tail']),
('simulation-monkey-hunter',8,'Dropping Target · Why aim at where a falling target started?',ARRAY['u1.pick-equation-of-motion','u1.vectors-tip-to-tail']),
('simulation-projectile-motion',8,'Launch Lab · Which part of the motion does gravity change?',ARRAY['u1.vectors-tip-to-tail','u1.pick-equation-of-motion'])
on conflict(slug) do update set day=excluded.day,title=excluded.title,target_slugs=excluded.target_slugs;
commit;
