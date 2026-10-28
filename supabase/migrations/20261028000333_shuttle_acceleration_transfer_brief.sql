-- Register a ready-to-assign brief; no class scheduling, work, mastery or release writes.
insert into public.interactive_assignment_templates (slug, day, title, target_slugs, is_lab)
values ('transfer-brief-shuttle-acceleration', 8, 'Will the shuttle be ready to merge?', array['u1.pick-equation-of-motion'], false)
on conflict (slug) do nothing;
