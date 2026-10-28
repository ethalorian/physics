-- Register catalog labs for the existing submission, AI and teacher-release workflow.
-- This does not assign work, change submissions, or publish grades.
do $$begin
 if exists(select 1 from (values ('u2.free-fall-g','unit-2'),
('u3.k2-impulse-theorem','unit-3'),
('u3.r1-extend-time','unit-3'),
('u1.vectors-tip-to-tail','unit-1'),
('u3.k4-collision-types','unit-3'),
('u3.s2-inelastic-solve','unit-3'),
('u3.r3-deflection','unit-3')) e(slug,unit_id) left join public.learning_targets t on t.slug=e.slug and t.unit_id=e.unit_id where t.id is null) then raise exception 'Lab targets are unavailable';end if;
end $$;
insert into public.interactive_assignment_templates(slug,day,title,target_slugs) values
('simulation-picket-fence-g',3,'Photogate · Find gravity in the graph',array['u2.free-fall-g']::text[]),
('simulation-impulse-momentum',4,'Impulse & Momentum · Design a gentler stop',array['u3.k2-impulse-theorem','u3.r1-extend-time']::text[]),
('simulation-riverboat-crossing-3d',6,'Riverboat Crossing · Heading is not the path',array['u1.vectors-tip-to-tail']::text[]),
('simulation-cart-collisions',7,'Cart Collisions · What survives a collision?',array['u3.k4-collision-types','u3.s2-inelastic-solve']::text[]),
('simulation-dart-deflection',15,'Kinetic Impactor · Test a deflection plan',array['u3.r3-deflection']::text[])
on conflict(slug) do nothing;
