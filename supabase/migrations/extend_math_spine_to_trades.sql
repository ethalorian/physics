-- Extend the EXISTING math spine over the trades units.
--
-- The open question was whether the trades metrology targets should be moved
-- into the math spine. Answer: no. The targets that recur in all six trades
-- units are mostly drawing and instrument discipline (sketch, dimension,
-- as-built, check-the-instrument, the walk) — permanent, but not mathematics.
-- "Recurs all year" and "is math" are different properties.
--
-- The spine already models what was wanted: a competency carries NO unit and
-- rolls up across the whole year. It just had no focus rows pointing at the
-- trades units. Adding them moves no learning target and changes no growth line.
--
-- Only clear fits are seeded. GV1-GV3 (vectors, graph slope/area), NS1, QE1
-- (scientific notation) and SM2 are deliberately absent — they do not occur in
-- this course, and pretending otherwise would be the drift this is fixing.

insert into public.math_competency_focus (competency_id, unit_id, role, physics_hook, order_index)
select mc.id, v.unit_id, v.role, v.hook, v.oi
from (values
  ('NS2', 'trades-1', 'introduce', 'reading a tape to 1/16 and 1/32', 1),
  ('NS2', 'trades-2', 'revisit',   'a quarter inch per foot is also 8.3 percent and 1-in-48', 2),
  ('PR1', 'trades-1', 'introduce', 'drawing to a stated scale, and checking somebody else''s', 1),
  ('PR1', 'trades-2', 'revisit',   'rise over run — one ratio, four trades'' units', 2),
  ('PR1', 'trades-4', 'revisit',   'the ratio of piston areas in a bottle jack', 3),
  ('PR2', 'trades-1', 'introduce', 'three gauge steps double the copper area', 1),
  ('PR2', 'trades-3', 'revisit',   'doubling a joist''s depth versus doubling its width', 2),
  ('PR2', 'trades-4', 'revisit',   'why pipe size does more for flow than pressure does', 3),
  ('PR2', 'trades-6', 'revisit',   'gauge, area and resistance', 4),
  ('QE2', 'trades-2', 'introduce', 'inches per foot across a twenty-two foot run', 1),
  ('QE2', 'trades-4', 'revisit',   'psi to feet of head', 2),
  ('QE2', 'trades-5', 'revisit',   'adding R-values across a real assembly', 3),
  ('QE3', 'trades-1', 'introduce', 'call it before you measure it', 1),
  ('QE3', 'trades-2', 'revisit',   'call the fall by eye, then check yourself', 2),
  ('QE4', 'trades-1', 'introduce', 'claim a tolerance, and state your uncertainty as a number', 1),
  ('QE4', 'trades-2', 'revisit',   'compare a riser spread to a 3/8 inch code limit', 2),
  ('SM1', 'trades-3', 'introduce', 'P = F / A, solved for the footing area', 1),
  ('SM1', 'trades-5', 'revisit',   'R-values in series', 2)
) as v(code, unit_id, role, hook, oi)
join public.math_competencies mc on mc.code = v.code
on conflict (competency_id, unit_id) do update
  set role = excluded.role,
      physics_hook = excluded.physics_hook,
      order_index = excluded.order_index;
