-- Independent ear and mouth accessories; existing slots, ownership, and prices remain valid.
ALTER TABLE public.avatar_items DROP CONSTRAINT IF EXISTS avatar_items_slot_check;
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_items_slot_check
  CHECK (slot IN ('eyewear', 'head', 'body', 'pin', 'background', 'facial_hair', 'ears', 'mouth'));

-- Ear artwork is authored at the round face anchors (±46, 2).
-- skin_tint replaces the reserved #E7B58B fill with the avatar's skin tone.
-- Mouth items replace the base expression inside its existing face/width transforms.
-- Body covers_neck allows the mock-neck dress to reach every face's chin.
INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('vampire-fangs','mouth','Vampire fangs',100,'<path d="M -11,21 Q 0,24 11,21 Q 9,33 0,33 Q -9,33 -11,21 Z" fill="#592638" stroke="#332031" stroke-width="1.2" stroke-linejoin="round"/><path d="M -8,22 L -3,23 L -5,30 Z M 3,23 L 8,22 L 5,30 Z" fill="#FFF9EC" stroke="#FFF9EC" stroke-width="0.6" stroke-linejoin="round"/><path d="M -3,31 Q 0,29 3,31" fill="none" stroke="#B75468" stroke-width="1.3" stroke-linecap="round"/>',110,'{}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('vampire-ears','ears','Pointed vampire ears',100,'<path d="M -43,-4 Q -51,-7 -60,-16 Q -60,0 -54,9 Q -50,15 -43,9 Z M 43,-4 Q 51,-7 60,-16 Q 60,0 54,9 Q 50,15 43,9 Z" fill="#E7B58B"/><path d="M -48,0 Q -53,-3 -56,-8 Q -55,2 -51,6 M 48,0 Q 53,-3 56,-8 Q 55,2 51,6" fill="none" stroke="#502D3E" stroke-width="1.7" stroke-opacity="0.3" stroke-linecap="round"/>',45,'{"skin_tint":true}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('midnight-vampire-dress','body','Midnight vampire dress',240,'<path d="M -9,45 L 9,45 L 11,60 Q 26,62 36,70 L 42,109 L 30,113 L 25,84 L 31,114 L -31,114 L -25,84 L -30,113 L -42,109 L -36,70 Q -26,62 -11,60 Z" fill="#272332" stroke="#51485E" stroke-width="1.4" stroke-linejoin="round"/><path d="M -37,76 L -27,79 M -39,86 L -29,89 M -40,96 L -30,99 M -41,106 L -31,109 M 37,76 L 27,79 M 39,86 L 29,89 M 40,96 L 30,99 M 41,106 L 31,109" stroke="#AC3F5C" stroke-width="4"/><path d="M -9,55 L 9,55 M -11,61 Q 0,67 11,61 M -25,76 L -20,94 M 25,76 L 20,94" fill="none" stroke="#62516D" stroke-width="1.2"/><path d="M -24,96 Q 0,99 24,96" fill="none" stroke="#AD4965" stroke-width="2.5"/><path d="M -4,97 L 0,93 L 4,97 L 0,101 Z" fill="#D7BCD5"/><path d="M -11,102 L -13,113 M 11,102 L 13,113" stroke="#514356" stroke-width="1.3"/>',10,'{"covers_neck":true}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('dracula-cape','body','Dracula cape & waistcoat',320,'<path d="M -12,61 L -34,29 Q -43,37 -43,54 L -54,113 Q -31,117 0,113 Q 31,117 54,113 L 43,54 Q 43,37 34,29 L 12,61 Z" fill="#242332" stroke="#4E465E" stroke-width="1.5" stroke-linejoin="round"/><path d="M -33,35 L -11,67 L -41,106 L -37,53 Z M 33,35 L 11,67 L 41,106 L 37,53 Z" fill="#922F4E"/><path d="M -9,60 L 9,60 L 22,70 L 27,113 L -27,113 L -22,70 Z" fill="#EEE5D8"/><path d="M -22,66 L 0,86 L 22,66 L 30,113 L -30,113 Z" fill="#483044"/><path d="M -22,67 L -11,90 L 0,84 M 22,67 L 11,90 L 0,84" fill="#68405A"/><path d="M -9,65 L 0,69 L 9,65 L 9,76 L 0,72 L -9,76 Z" fill="#A73A55"/><circle cx="0" cy="70" r="2.6" fill="#CF657A"/><path d="M 0,86 L 0,112" stroke="#806076" stroke-width="1"/><circle cx="4" cy="93" r="1.6" fill="#D6B379"/><circle cx="4" cy="104" r="1.6" fill="#D6B379"/>',10,'{}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('night-bat-hoodie','body','Night bat hoodie',200,'<path d="M -10,59 Q -27,60 -37,71 L -43,110 L -30,113 L -25,85 L -29,113 L 29,113 L 25,85 L 30,113 L 43,110 L 37,71 Q 27,60 10,59 Z" fill="#302B42" stroke="#534765" stroke-width="1.4" stroke-linejoin="round"/><path d="M -10,58 Q -29,52 -22,73 L -11,79 L 0,69 L 11,79 L 22,73 Q 29,52 10,58 L 0,66 Z" fill="#5A3B60" stroke="#786080" stroke-width="1.2"/><path d="M -19,84 Q -10,85 -4,89 L -3,83 L 0,86 L 3,83 L 4,89 Q 10,85 19,84 L 14,94 Q 10,90 7,96 Q 3,93 0,100 Q -3,93 -7,96 Q -10,90 -14,94 Z" fill="#CBB0D9"/><path d="M -10,76 L -10,82 M 10,76 L 10,82" stroke="#EEE5F4" stroke-width="1.8" stroke-linecap="round"/><path d="M -15,101 L -18,108 L 18,108 L 15,101" fill="none" stroke="#756280" stroke-width="1.4"/><path d="M -41,105 L -31,108 M 41,105 L 31,108" stroke="#AF4865" stroke-width="4"/>',10,'{}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.avatar_items(slug,slot,name,cost_xp,svg_layer,z_order,render_options,sort_order)
VALUES ('ruby-bat-pendant','pin','Ruby bat pendant',120,'<path d="M -11,65 Q -12,82 0,90 Q 12,82 11,65" fill="none" stroke="#CEC1D8" stroke-width="1.8"/><path d="M -14,87 Q -8,87 -3,90 L 0,88 L 3,90 Q 8,87 14,87 L 11,94 Q 7,91 4,96 L 0,98 L -4,96 Q -7,91 -11,94 Z" fill="#51425F" stroke="#D5C3DE" stroke-width="0.9"/><path d="M 0,90 L 4,94 L 0,100 L -4,94 Z" fill="#BF3E63" stroke="#E6B6C6" stroke-width="0.8"/><path d="M 0,91 L 0,98 L -3,94 Z" fill="#EE859B"/>',140,'{}'::jsonb,110)
ON CONFLICT (slug) DO NOTHING;

