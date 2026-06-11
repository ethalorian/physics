-- Unit 3 chapter ingestion: Conceptual Physics chapter 8 (Momentum)
-- page_offset = bookPage - pdfPage: 124 - 1 = 123 (verified: book 142 on pdf p.19 -> 142 - 19 = 123)

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  8,
  'Momentum',
  'https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte08.pdf',
  123,
  $ch08$[
    {
      "id": "8.1",
      "label": "Momentum",
      "pageStart": 125,
      "pageEnd": 125,
      "items": [
        { "n": 1, "type": "fill_in", "blanks": 1, "prompt": "By momentum, we mean ___ in motion." },
        { "n": 2, "type": "fill_in", "blanks": 2, "prompt": "More specifically, momentum is the ___ of an object multiplied by its ___." },
        { "n": 3, "type": "true_false", "prompt": "True or false: A large truck at rest has more momentum than a moving roller skate." },
        { "n": 4, "type": "multiple_choice", "prompt": "A moving object can have a large momentum if it has", "options": [
          { "letter": "a", "text": "a large mass only" },
          { "letter": "b", "text": "a high speed only" },
          { "letter": "c", "text": "a large mass, a high speed, or both" }
        ] },
        { "n": 5, "type": "short_answer", "prompt": "Can a roller skate and a truck ever have the same momentum? Explain." }
      ]
    },
    {
      "id": "8.2",
      "label": "Impulse Changes Momentum",
      "pageStart": 125,
      "pageEnd": 129,
      "items": [
        { "n": 6, "type": "fill_in", "blanks": 1, "prompt": "The quantity force × time interval is called ___." },
        { "n": 7, "type": "fill_in", "blanks": 1, "prompt": "The greater the impulse exerted on something, the greater will be the change in ___." },
        { "n": 8, "type": "true_false", "prompt": "True or false: When a car stops by hitting a haystack instead of a concrete wall, its change in momentum is smaller." },
        { "n": 9, "type": "multiple_choice", "prompt": "If the time of impact is extended 100 times, the force of impact is", "options": [
          { "letter": "a", "text": "100 times greater" },
          { "letter": "b", "text": "unchanged" },
          { "letter": "c", "text": "reduced 100 times" }
        ] },
        { "n": 10, "type": "short_answer", "prompt": "Why does a boxer move away from (\"ride\" with) a punch rather than move toward it?" }
      ]
    },
    {
      "id": "8.3",
      "label": "Bouncing",
      "pageStart": 129,
      "pageEnd": 130,
      "items": [
        { "n": 11, "type": "fill_in", "blanks": 1, "prompt": "Impulses are ___ when an object bounces than when the same object comes to a sudden stop." },
        { "n": 12, "type": "fill_in", "blanks": 1, "prompt": "Lester A. Pelton designed a curve-shaped paddle that caused the incoming water to make a ___ upon impact." },
        { "n": 13, "type": "true_false", "prompt": "True or false: It takes a greater impulse to catch a falling flower pot and throw it back up than merely to catch it." },
        { "n": 14, "type": "multiple_choice", "prompt": "The Pelton Wheel was so effective because the \"bouncing\" water", "options": [
          { "letter": "a", "text": "reduced the impulse exerted on the waterwheel" },
          { "letter": "b", "text": "increased the impulse exerted on the waterwheel" },
          { "letter": "c", "text": "eliminated friction in the waterwheel" }
        ] },
        { "n": 15, "type": "short_answer", "prompt": "Why may you be in more serious trouble if a falling flower pot bounces from your head than if it just stops there?" }
      ]
    },
    {
      "id": "8.4",
      "label": "Conservation of Momentum",
      "pageStart": 130,
      "pageEnd": 132,
      "items": [
        { "n": 16, "type": "fill_in", "blanks": 1, "prompt": "To change the momentum of an object, the force or impulse must be exerted on the object by something ___ the object — internal forces won't work." },
        { "n": 17, "type": "fill_in", "blanks": 2, "prompt": "The law of conservation of momentum states that, in the absence of a(n) ___ force, the momentum of a system remains ___." },
        { "n": 18, "type": "true_false", "prompt": "True or false: A push against the dashboard of a car you're sitting in changes the momentum of the car." },
        { "n": 19, "type": "true_false", "prompt": "True or false: Before a cannon is fired, the momentum of the cannon–cannonball system is zero." },
        { "n": 20, "type": "multiple_choice", "prompt": "Just after a cannon is fired, the net momentum of the cannon–cannonball system is", "options": [
          { "letter": "a", "text": "zero" },
          { "letter": "b", "text": "in the direction of the cannonball" },
          { "letter": "c", "text": "in the direction of the recoiling cannon" }
        ] },
        { "n": 21, "type": "short_answer", "prompt": "Why don't the forces between the cannon and the cannonball change the momentum of the cannon–cannonball system?" }
      ]
    },
    {
      "id": "8.5",
      "label": "Collisions",
      "pageStart": 132,
      "pageEnd": 135,
      "items": [
        { "n": 22, "type": "fill_in", "blanks": 1, "prompt": "Whenever objects collide in the absence of external forces, the net momentum of both objects before the collision equals the net momentum of both objects ___ the collision." },
        { "n": 23, "type": "fill_in", "blanks": 1, "prompt": "A collision in which the colliding objects become distorted and generate heat during the collision is a(n) ___ collision." },
        { "n": 24, "type": "true_false", "prompt": "True or false: Momentum is conserved only when collisions are perfectly elastic." },
        { "n": 25, "type": "multiple_choice", "prompt": "A freight car moving at 4 m/s couples with an identical freight car at rest. The velocity of the coupled cars after impact is", "options": [
          { "letter": "a", "text": "4 m/s" },
          { "letter": "b", "text": "2 m/s" },
          { "letter": "c", "text": "1 m/s" }
        ] },
        { "n": 26, "type": "short_answer", "prompt": "Describe what happens when a moving billiard ball collides head-on with an identical billiard ball at rest (an elastic collision)." }
      ]
    },
    {
      "id": "8.6",
      "label": "Momentum Vectors",
      "pageStart": 135,
      "pageEnd": 136,
      "items": [
        { "n": 27, "type": "fill_in", "blanks": 1, "prompt": "The ___ sum of the momenta is the same before and after a collision." },
        { "n": 28, "type": "fill_in", "blanks": 1, "prompt": "When a falling firecracker bursts, the momenta of its fragments combine by vector rules to equal the original ___ of the falling firecracker." },
        { "n": 29, "type": "true_false", "prompt": "True or false: Momentum is conserved only when interacting objects move along the same straight line." },
        { "n": 30, "type": "multiple_choice", "prompt": "Car A moves due east and car B moves due north with momenta equal in magnitude. After they collide, their combined momentum is directed", "options": [
          { "letter": "a", "text": "due east" },
          { "letter": "b", "text": "northeast" },
          { "letter": "c", "text": "due north" }
        ] },
        { "n": 31, "type": "short_answer", "prompt": "Why are the conservation laws so useful to experimenters studying collisions in the atomic and subatomic realms?" }
      ]
    }
  ]$ch08$::jsonb,
  $ch08${
    "1": ["inertia"],
    "2": ["mass", "velocity"],
    "3": "false",
    "4": "c",
    "5": { "model": "Yes — a slowly rolling truck and a fast-moving roller skate can have the same momentum, since momentum depends on both mass and speed." },
    "6": ["impulse"],
    "7": ["momentum"],
    "8": "false",
    "9": "c",
    "10": { "model": "Moving away from the punch extends the time of contact, and a longer time for the same change in momentum means a smaller force." },
    "11": ["greater"],
    "12": ["u-turn"],
    "13": "true",
    "14": "b",
    "15": { "model": "Bouncing requires a greater impulse — your head must supply the extra impulse to throw the pot back up, so the force on your head is greater." },
    "16": ["outside"],
    "17": ["external", "unchanged"],
    "18": "false",
    "19": "true",
    "20": "a",
    "21": { "model": "They are internal forces of the system — they come in equal and opposite pairs that cancel, so the system's net momentum stays the same." },
    "22": ["after"],
    "23": ["inelastic"],
    "24": "false",
    "25": "b",
    "26": { "model": "The first ball comes to rest and the second ball moves away with a velocity equal to the initial velocity of the first ball — the momentum is transferred." },
    "27": ["vector"],
    "28": ["momentum"],
    "29": "false",
    "30": "b",
    "31": { "model": "Forces do not show up in the conservation equations, so detailed information can be obtained without knowing the complicated forces in the collision." }
  }$ch08$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();
