-- Unit 5 chapter ingestion: Conceptual Physics chapters 21-24
-- page_offsets (bookPage - pdfPage), each verified near chapter start AND end:
--   ch21: 406 - 1 = 405 (verified: book 429 on pdf p.24 -> 429 - 24 = 405)
--   ch22: 430 - 1 = 429 (verified: book 449 on pdf p.20 -> 449 - 20 = 429)
--   ch23: 450 - 1 = 449 (verified: book 467 on pdf p.18 -> 467 - 18 = 449)
--   ch24: 468 - 1 = 467 (verified: book 485 on pdf p.18 -> 485 - 18 = 467)

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  21,
  'Temperature, Heat, and Expansion',
  'https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte21.pdf',
  405,
  $ch21$[
    {
      "id": "21.1",
      "label": "Temperature",
      "pageStart": 407,
      "pageEnd": 408,
      "items": [
        { "n": 1, "type": "fill_in", "blanks": 1, "prompt": "The quantity that tells how hot or cold something is compared with a standard is ___." },
        { "n": 2, "type": "fill_in", "blanks": 2, "prompt": "On the Celsius scale, the number ___ is assigned to the temperature at which water freezes, and the number ___ to the temperature at which water boils." },
        { "n": 3, "type": "true_false", "prompt": "True or false: On the Kelvin scale, the number 0 is assigned to the lowest possible temperature — absolute zero." },
        { "n": 4, "type": "multiple_choice", "prompt": "Temperature is closely related to the", "options": [
          { "letter": "a", "text": "total kinetic energy of all the molecules in a substance" },
          { "letter": "b", "text": "average kinetic energy of translational motion of the molecules" },
          { "letter": "c", "text": "potential energy stored between molecules" }
        ] },
        { "n": 5, "type": "short_answer", "prompt": "There is twice as much kinetic energy in 2 liters of boiling water as in 1 liter. Why are the temperatures of both liters the same?" }
      ]
    },
    {
      "id": "21.2",
      "label": "Heat",
      "pageStart": 409,
      "pageEnd": 409,
      "items": [
        { "n": 6, "type": "fill_in", "blanks": 1, "prompt": "The energy that transfers from one object to another because of a temperature difference between them is called ___." },
        { "n": 7, "type": "fill_in", "blanks": 1, "prompt": "When heat flows between objects or substances that are touching, the objects are said to be in thermal ___." },
        { "n": 8, "type": "true_false", "prompt": "True or false: Matter contains heat." },
        { "n": 9, "type": "multiple_choice", "prompt": "A red-hot thumbtack is immersed in a large bowl of warm water that has more total molecular kinetic energy than the tack. Heat flows", "options": [
          { "letter": "a", "text": "from the water to the tack, because the water has more total energy" },
          { "letter": "b", "text": "from the tack to the water, because the tack has the higher temperature" },
          { "letter": "c", "text": "in neither direction" }
        ] },
        { "n": 10, "type": "short_answer", "prompt": "What determines the direction of spontaneous heat flow between two substances in thermal contact?" }
      ]
    },
    {
      "id": "21.3",
      "label": "Thermal Equilibrium",
      "pageStart": 410,
      "pageEnd": 410,
      "items": [
        { "n": 11, "type": "fill_in", "blanks": 1, "prompt": "After objects in thermal contact with each other reach the same temperature, we say the objects are in thermal ___." },
        { "n": 12, "type": "fill_in", "blanks": 1, "prompt": "A thermometer, interestingly enough, shows only its own ___." },
        { "n": 13, "type": "true_false", "prompt": "True or false: When objects are in thermal equilibrium, no heat flows between them." },
        { "n": 14, "type": "multiple_choice", "prompt": "A thermometer should be small enough that it", "options": [
          { "letter": "a", "text": "does not appreciably alter the temperature of the substance being measured" },
          { "letter": "b", "text": "can fit inside any container" },
          { "letter": "c", "text": "reaches a higher temperature than its surroundings" }
        ] }
      ]
    },
    {
      "id": "21.4",
      "label": "Internal Energy",
      "pageStart": 411,
      "pageEnd": 411,
      "items": [
        { "n": 15, "type": "fill_in", "blanks": 1, "prompt": "The grand total of all energies inside a substance is called its ___ energy." },
        { "n": 16, "type": "fill_in", "blanks": 1, "prompt": "Besides translational kinetic energy, a substance has ___ kinetic energy of molecules and potential energy due to the forces between molecules." },
        { "n": 17, "type": "true_false", "prompt": "True or false: When a substance takes in or gives off heat, its internal energy changes." },
        { "n": 18, "type": "multiple_choice", "prompt": "When ice is melting, the substance absorbs heat", "options": [
          { "letter": "a", "text": "and its temperature rises rapidly" },
          { "letter": "b", "text": "without an increase in temperature — it changes phase" },
          { "letter": "c", "text": "and its internal energy decreases" }
        ] }
      ]
    },
    {
      "id": "21.5",
      "label": "Measurement of Heat",
      "pageStart": 411,
      "pageEnd": 412,
      "items": [
        { "n": 19, "type": "fill_in", "blanks": 1, "prompt": "The calorie is defined as the amount of heat required to raise the temperature of 1 ___ of water by 1°C." },
        { "n": 20, "type": "fill_in", "blanks": 1, "prompt": "The relationship between calories and joules is that 1 calorie equals ___ joules." },
        { "n": 21, "type": "true_false", "prompt": "True or false: The heat unit used in rating foods, often called the Calorie (with a capital C), is actually a kilocalorie." },
        { "n": 22, "type": "multiple_choice", "prompt": "The energy value in food is determined by", "options": [
          { "letter": "a", "text": "burning the food and measuring the energy released as heat" },
          { "letter": "b", "text": "weighing the food before and after cooking" },
          { "letter": "c", "text": "measuring the food's temperature" }
        ] },
        { "n": 23, "type": "short_answer", "prompt": "How can the amount of heat transferred to a substance be determined?" }
      ]
    },
    {
      "id": "21.6",
      "label": "Specific Heat Capacity",
      "pageStart": 413,
      "pageEnd": 414,
      "items": [
        { "n": 24, "type": "fill_in", "blanks": 1, "prompt": "The quantity of heat required to raise the temperature of a unit mass of a material by 1 degree is the material's ___ heat capacity." },
        { "n": 25, "type": "fill_in", "blanks": 1, "prompt": "We can think of specific heat capacity as thermal ___, since it signifies the resistance of a substance to change in its temperature." },
        { "n": 26, "type": "true_false", "prompt": "True or false: It takes about eight times as much energy to raise the temperature of a gram of iron by 1°C as a gram of water." },
        { "n": 27, "type": "multiple_choice", "prompt": "Temperature is a measure only of the kinetic energy of", "options": [
          { "letter": "a", "text": "translational motion of molecules" },
          { "letter": "b", "text": "rotation of molecules" },
          { "letter": "c", "text": "internal vibrations within molecules" }
        ] },
        { "n": 28, "type": "short_answer", "prompt": "Why does water absorb more heat per gram than iron for the same change in temperature?" }
      ]
    },
    {
      "id": "21.7",
      "label": "The High Specific Heat Capacity of Water",
      "pageStart": 415,
      "pageEnd": 416,
      "items": [
        { "n": 29, "type": "fill_in", "blanks": 1, "prompt": "Because a relatively small amount of water absorbs a great deal of heat for a small temperature rise, water is a very useful ___ agent in automobile engines." },
        { "n": 30, "type": "fill_in", "blanks": 1, "prompt": "The Atlantic current known as the ___ brings warm water northeast from the Caribbean toward Europe." },
        { "n": 31, "type": "true_false", "prompt": "True or false: If water did not have a high heat capacity, the countries of Europe would be about as cold as the northeastern regions of Canada." },
        { "n": 32, "type": "multiple_choice", "prompt": "San Francisco is warmer in winter and cooler in summer than Washington, D.C., because", "options": [
          { "letter": "a", "text": "it lies at a much lower latitude" },
          { "letter": "b", "text": "westerly winds reach it after moving over ocean water, whose temperature varies little" },
          { "letter": "c", "text": "it receives more of the sun's energy per square kilometer" }
        ] },
        { "n": 33, "type": "short_answer", "prompt": "Why does the central interior of a large continent, such as Manitoba and the Dakotas, usually experience extremes of temperature?" }
      ]
    },
    {
      "id": "21.8",
      "label": "Thermal Expansion",
      "pageStart": 416,
      "pageEnd": 419,
      "items": [
        { "n": 34, "type": "fill_in", "blanks": 2, "prompt": "Most forms of matter expand when they are ___ and contract when they are ___." },
        { "n": 35, "type": "fill_in", "blanks": 1, "prompt": "When a bimetallic strip is heated, the difference in the amounts of expansion of the two metals causes the strip to ___ into a curve." },
        { "n": 36, "type": "true_false", "prompt": "True or false: For comparable pressures and comparable changes in temperature, liquids generally expand or contract more than solids." },
        { "n": 37, "type": "true_false", "prompt": "True or false: Gases generally expand or contract less than liquids for comparable changes in temperature." },
        { "n": 38, "type": "multiple_choice", "prompt": "A thermostat controls room temperature by means of", "options": [
          { "letter": "a", "text": "the expansion of mercury in a glass tube" },
          { "letter": "b", "text": "the back-and-forth bending of a bimetallic coil that opens and closes an electric circuit" },
          { "letter": "c", "text": "an infrared sensor pointed at the room" }
        ] },
        { "n": 39, "type": "short_answer", "prompt": "Why are gaps called expansion joints left in concrete sidewalks and in the roadways of long bridges?" }
      ]
    },
    {
      "id": "21.9",
      "label": "Expansion of Water",
      "pageStart": 419,
      "pageEnd": 422,
      "items": [
        { "n": 40, "type": "fill_in", "blanks": 1, "prompt": "As ice-cold water at 0°C is heated, it contracts until it reaches a temperature of ___°C, and only then begins to expand." },
        { "n": 41, "type": "fill_in", "blanks": 1, "prompt": "Ice is less dense than water because ice has open-structured, six-sided ___." },
        { "n": 42, "type": "true_false", "prompt": "True or false: Water has its greatest density at its freezing point, 0°C." },
        { "n": 43, "type": "true_false", "prompt": "True or false: Before any ice can form on a pond, all the water in the pond must be cooled to 4°C." },
        { "n": 44, "type": "multiple_choice", "prompt": "Ponds freeze from the", "options": [
          { "letter": "a", "text": "bottom up" },
          { "letter": "b", "text": "top down" },
          { "letter": "c", "text": "middle outward" }
        ] },
        { "n": 45, "type": "short_answer", "prompt": "Why are very deep bodies of water not ice-covered even in the coldest of winters?" }
      ]
    }
  ]$ch21$::jsonb,
  $ch21${
    "1": ["temperature"],
    "2": ["0", "100"],
    "3": "true",
    "4": "b",
    "5": { "model": "Temperature depends on the average kinetic energy per molecule, not the total — and the average kinetic energy of molecules in each liter is the same." },
    "6": ["heat"],
    "7": ["contact"],
    "8": "false",
    "9": "b",
    "10": { "model": "Temperature difference — heat flows spontaneously from the higher-temperature substance to the lower-temperature substance, never the reverse on its own." },
    "11": ["equilibrium"],
    "12": ["temperature"],
    "13": "true",
    "14": "a",
    "15": ["internal"],
    "16": ["rotational"],
    "17": "true",
    "18": "b",
    "19": ["gram"],
    "20": ["4.186"],
    "21": "true",
    "22": "a",
    "23": { "model": "By measuring the temperature change of a known mass of a substance that absorbs the heat." },
    "24": ["specific"],
    "25": ["inertia"],
    "26": "false",
    "27": "a",
    "28": { "model": "Water molecules soak up a lot of energy in rotations, internal vibrations, and bond stretching, which don't raise temperature; iron atoms mainly shake back and forth translationally." },
    "29": ["cooling"],
    "30": ["gulf stream"],
    "31": "true",
    "32": "b",
    "33": { "model": "Because of the absence of large bodies of water, whose high specific heat would otherwise moderate the temperature." },
    "34": ["heated", "cooled"],
    "35": ["bend"],
    "36": "true",
    "37": "false",
    "38": "b",
    "39": { "model": "They allow the material to expand and contract with summer-winter temperature changes so the surface doesn't crack or buckle." },
    "40": ["4"],
    "41": ["crystals"],
    "42": "false",
    "43": "true",
    "44": "b",
    "45": { "model": "All the water must first be cooled to 4°C before surface water can cool further, and winter is not long enough for all the water in a deep lake to reach 4°C." }
  }$ch21$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  22,
  'Heat Transfer',
  'https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte22.pdf',
  429,
  $ch22$[
    {
      "id": "22.1",
      "label": "Conduction",
      "pageStart": 431,
      "pageEnd": 432,
      "items": [
        { "n": 1, "type": "fill_in", "blanks": 1, "prompt": "Conduction of heat is the transfer of energy within materials and between different materials that are in direct ___." },
        { "n": 2, "type": "fill_in", "blanks": 1, "prompt": "Among the common metals, ___ is the most conductive, followed by copper, aluminum, and iron." },
        { "n": 3, "type": "true_false", "prompt": "True or false: A tile floor feels colder to bare feet than a carpet at the same temperature because tile is a better conductor than carpet." },
        { "n": 4, "type": "true_false", "prompt": "True or false: Snow is a source of heat that warms Earth's surface and animal dwellings." },
        { "n": 5, "type": "multiple_choice", "prompt": "Materials such as wool, fur, and feathers are good insulators largely because they", "options": [
          { "letter": "a", "text": "contain many small air spaces" },
          { "letter": "b", "text": "have loose outer electrons" },
          { "letter": "c", "text": "reflect infrared radiation" }
        ] },
        { "n": 6, "type": "short_answer", "prompt": "Why can no insulator totally prevent a warm home from cooling in winter?" }
      ]
    },
    {
      "id": "22.2",
      "label": "Convection",
      "pageStart": 433,
      "pageEnd": 435,
      "items": [
        { "n": 7, "type": "fill_in", "blanks": 1, "prompt": "Convection is a means of heat transfer by movement of the heated ___ itself, such as by currents in a fluid." },
        { "n": 8, "type": "fill_in", "blanks": 1, "prompt": "When a fluid is heated, it expands, becomes less ___, and rises." },
        { "n": 9, "type": "true_false", "prompt": "True or false: Expanding air warms." },
        { "n": 10, "type": "multiple_choice", "prompt": "In the daytime at the seashore, the shore warms more easily than the water, so air over the shore rises and cooler air from over the water takes its place. The result is a", "options": [
          { "letter": "a", "text": "sea breeze" },
          { "letter": "b", "text": "chinook" },
          { "letter": "c", "text": "monsoon" }
        ] },
        { "n": 11, "type": "short_answer", "prompt": "Why does rising warm air cool as it rises?" }
      ]
    },
    {
      "id": "22.3",
      "label": "Radiation",
      "pageStart": 436,
      "pageEnd": 436,
      "items": [
        { "n": 12, "type": "fill_in", "blanks": 1, "prompt": "Radiation is energy transmitted by ___ waves." },
        { "n": 13, "type": "fill_in", "blanks": 1, "prompt": "Any energy that is transmitted by radiation is called ___ energy." },
        { "n": 14, "type": "true_false", "prompt": "True or false: The sun's heat reaches Earth by convection through the space between the sun and Earth." },
        { "n": 15, "type": "multiple_choice", "prompt": "Which list gives types of radiant energy in order of wavelength, from longest to shortest?", "options": [
          { "letter": "a", "text": "radio waves, infrared radiation, visible light, ultraviolet radiation" },
          { "letter": "b", "text": "gamma rays, X-rays, visible light, radio waves" },
          { "letter": "c", "text": "visible light, radio waves, gamma rays, infrared radiation" }
        ] }
      ]
    },
    {
      "id": "22.4",
      "label": "Emission of Radiant Energy",
      "pageStart": 437,
      "pageEnd": 438,
      "items": [
        { "n": 16, "type": "fill_in", "blanks": 1, "prompt": "Objects of everyday temperatures emit waves mostly in the long-wavelength end of the ___ region." },
        { "n": 17, "type": "fill_in", "blanks": 1, "prompt": "Radiant energy that is emitted by Earth is called ___ radiation." },
        { "n": 18, "type": "true_false", "prompt": "True or false: Only hot things radiate energy." },
        { "n": 19, "type": "multiple_choice", "prompt": "The average frequency of radiant energy emitted by an object is directly proportional to the object's", "options": [
          { "letter": "a", "text": "mass" },
          { "letter": "b", "text": "Kelvin temperature" },
          { "letter": "c", "text": "volume" }
        ] },
        { "n": 20, "type": "short_answer", "prompt": "Why does a blue-hot star have nearly twice the surface temperature of a red-hot star?" }
      ]
    },
    {
      "id": "22.5",
      "label": "Absorption of Radiant Energy",
      "pageStart": 438,
      "pageEnd": 439,
      "items": [
        { "n": 21, "type": "fill_in", "blanks": 1, "prompt": "Good emitters of radiant energy are also good ___." },
        { "n": 22, "type": "fill_in", "blanks": 1, "prompt": "A perfect absorber reflects no radiant energy and appears perfectly ___." },
        { "n": 23, "type": "true_false", "prompt": "True or false: A dark automobile body that stays hotter than its surroundings on a hot day also cools faster at nightfall." },
        { "n": 24, "type": "multiple_choice", "prompt": "Open ends of pipes and open doorways of distant houses appear black in the daytime because", "options": [
          { "letter": "a", "text": "they are always painted dark colors inside" },
          { "letter": "b", "text": "radiant energy that enters is reflected from the inside walls many times and partly absorbed at each reflection until little or none comes back out" },
          { "letter": "c", "text": "they are much colder than their surroundings" }
        ] },
        { "n": 25, "type": "short_answer", "prompt": "A book on your desk continuously radiates energy. Why doesn't its temperature keep dropping?" }
      ]
    },
    {
      "id": "22.6",
      "label": "Newton's Law of Cooling",
      "pageStart": 440,
      "pageEnd": 441,
      "items": [
        { "n": 26, "type": "fill_in", "blanks": 1, "prompt": "The rate of cooling of an object is approximately proportional to the temperature ___ between the object and its surroundings." },
        { "n": 27, "type": "fill_in", "blanks": 1, "prompt": "Newton's law of cooling also holds for ___ — frozen food warms up faster in a warmer room." },
        { "n": 28, "type": "true_false", "prompt": "True or false: The temperature change per minute of a hot apple pie will be greater in a cold freezer than on the kitchen table." },
        { "n": 29, "type": "multiple_choice", "prompt": "Record-breaking cold nights occur when the skies are clear because", "options": [
          { "letter": "a", "text": "clear air conducts heat away from the ground faster" },
          { "letter": "b", "text": "Earth's surface then radiates to the frigid depths of space instead of to nearby clouds" },
          { "letter": "c", "text": "starlight cools the ground" }
        ] }
      ]
    },
    {
      "id": "22.7",
      "label": "Global Warming and the Greenhouse Effect",
      "pageStart": 441,
      "pageEnd": 443,
      "items": [
        { "n": 30, "type": "fill_in", "blanks": 1, "prompt": "The greenhouse effect is the warming of a planet's surface due to the trapping of radiation by the planet's ___." },
        { "n": 31, "type": "fill_in", "blanks": 2, "prompt": "Glass is transparent to ___ light waves but absorbs ___ waves." },
        { "n": 32, "type": "true_false", "prompt": "True or false: Without the greenhouse effect, Earth would be a frigid -18°C." },
        { "n": 33, "type": "true_false", "prompt": "True or false: Although water vapor is the main greenhouse gas, CO2 is the gas most rapidly increasing in the atmosphere." },
        { "n": 34, "type": "multiple_choice", "prompt": "A car parked in bright sunlight with its windows rolled up gets very hot inside because", "options": [
          { "letter": "a", "text": "the sun's short waves pass in through the glass, but the longer waves reradiated by the interior cannot pass back out" },
          { "letter": "b", "text": "glass is an excellent conductor of heat" },
          { "letter": "c", "text": "convection currents carry heat in through the windows" }
        ] },
        { "n": 35, "type": "short_answer", "prompt": "What is the near unanimous view of climate scientists about the cause of global warming?" }
      ]
    }
  ]$ch22$::jsonb,
  $ch22${
    "1": ["contact"],
    "2": ["silver"],
    "3": "true",
    "4": "false",
    "5": "a",
    "6": { "model": "An insulator only reduces the rate at which heat penetrates — it slows down heat transfer but cannot stop it entirely." },
    "7": ["substance"],
    "8": ["dense"],
    "9": "false",
    "10": "a",
    "11": { "model": "Less atmospheric pressure squeezes on it at higher altitudes, so the air expands — and expanding air cools." },
    "12": ["electromagnetic"],
    "13": ["radiant"],
    "14": "false",
    "15": "a",
    "16": ["infrared"],
    "17": ["terrestrial"],
    "18": "false",
    "19": "b",
    "20": { "model": "Blue light has nearly twice the frequency of red light, and emitted frequency is directly proportional to the Kelvin temperature of the emitter." },
    "21": ["absorbers"],
    "22": ["black"],
    "23": "true",
    "24": "b",
    "25": { "model": "It also absorbs energy from its environment at the same rate it radiates — it is in thermal equilibrium with its surroundings." },
    "26": ["difference"],
    "27": ["heating"],
    "28": "true",
    "29": "b",
    "30": ["atmosphere"],
    "31": ["visible", "infrared"],
    "32": "true",
    "33": "true",
    "34": "a",
    "35": { "model": "That human activity is a main driver of global warming and climate change." }
  }$ch22$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  23,
  'Change of Phase',
  'https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte23.pdf',
  449,
  $ch23$[
    {
      "id": "23.1",
      "label": "Evaporation",
      "pageStart": 451,
      "pageEnd": 451,
      "items": [
        { "n": 1, "type": "fill_in", "blanks": 2, "prompt": "Evaporation is a change of phase from liquid to ___ that takes place at the ___ of a liquid." },
        { "n": 2, "type": "fill_in", "blanks": 1, "prompt": "Evaporation is a process that ___ the liquid left behind." },
        { "n": 3, "type": "true_false", "prompt": "True or false: The molecules that break free of a liquid's surface during evaporation are the slowest-moving ones." },
        { "n": 4, "type": "multiple_choice", "prompt": "A canteen stays cool when the cloth covering on its sides is kept wet because", "options": [
          { "letter": "a", "text": "wet cloth conducts heat into the canteen" },
          { "letter": "b", "text": "the faster-moving water molecules leave the cloth, lowering its temperature" },
          { "letter": "c", "text": "the cloth blocks radiation from the sun" }
        ] },
        { "n": 5, "type": "short_answer", "prompt": "How does sweating help the human body maintain a stable temperature?" }
      ]
    },
    {
      "id": "23.2",
      "label": "Condensation",
      "pageStart": 452,
      "pageEnd": 453,
      "items": [
        { "n": 6, "type": "fill_in", "blanks": 2, "prompt": "Condensation is the changing of a ___ to a ___." },
        { "n": 7, "type": "fill_in", "blanks": 1, "prompt": "The ratio of how much water vapor is in the air to the maximum amount that could be in the air at the same temperature is the relative ___." },
        { "n": 8, "type": "true_false", "prompt": "True or false: A steam burn is more damaging than a burn from boiling water of the same temperature." },
        { "n": 9, "type": "true_false", "prompt": "True or false: Condensation cools the area where the liquid forms." },
        { "n": 10, "type": "multiple_choice", "prompt": "Fog is basically", "options": [
          { "letter": "a", "text": "smoke trapped near the ground" },
          { "letter": "b", "text": "a cloud that forms near the ground" },
          { "letter": "c", "text": "dust suspended in dry air" }
        ] },
        { "n": 11, "type": "short_answer", "prompt": "Why are slow-moving water vapor molecules more likely than fast-moving ones to condense when they collide?" }
      ]
    },
    {
      "id": "23.3",
      "label": "Evaporation and Condensation Rates",
      "pageStart": 454,
      "pageEnd": 454,
      "items": [
        { "n": 12, "type": "fill_in", "blanks": 2, "prompt": "If evaporation exceeds condensation, the liquid is ___; if condensation exceeds evaporation, the liquid is ___." },
        { "n": 13, "type": "fill_in", "blanks": 1, "prompt": "In a covered dish of water, the water level doesn't change because evaporation and condensation occur continuously at ___ rates." },
        { "n": 14, "type": "true_false", "prompt": "True or false: You feel chillier outside the shower stall than inside because in the moist stall, condensation on your skin counteracts the cooling of evaporation." },
        { "n": 15, "type": "multiple_choice", "prompt": "If as much moisture condenses on your skin as evaporates from it, you will feel", "options": [
          { "letter": "a", "text": "much colder" },
          { "letter": "b", "text": "much warmer" },
          { "letter": "c", "text": "no change in body temperature" }
        ] }
      ]
    },
    {
      "id": "23.4",
      "label": "Boiling",
      "pageStart": 454,
      "pageEnd": 455,
      "items": [
        { "n": 16, "type": "fill_in", "blanks": 1, "prompt": "The change of phase from liquid to gas beneath a liquid's surface is called ___." },
        { "n": 17, "type": "fill_in", "blanks": 1, "prompt": "Increasing the pressure on the surface of a liquid ___ the boiling point of the liquid." },
        { "n": 18, "type": "true_false", "prompt": "True or false: In Denver, the 'mile-high city,' water boils at 95°C instead of 100°C." },
        { "n": 19, "type": "true_false", "prompt": "True or false: It is the boiling process itself, not the high temperature of the water, that cooks food." },
        { "n": 20, "type": "multiple_choice", "prompt": "A pressure cooker cooks food faster because", "options": [
          { "letter": "a", "text": "the trapped vapor increases pressure on the water's surface, forcing the water to reach a higher temperature before boiling" },
          { "letter": "b", "text": "it lowers the boiling point of the water" },
          { "letter": "c", "text": "the sealed lid keeps cold air away from the food" }
        ] },
        { "n": 21, "type": "short_answer", "prompt": "Why does the temperature of boiling water remain at 100°C no matter how much heat is applied?" }
      ]
    },
    {
      "id": "23.5",
      "label": "Freezing",
      "pageStart": 456,
      "pageEnd": 456,
      "items": [
        { "n": 22, "type": "fill_in", "blanks": 1, "prompt": "The change in phase from liquid to solid is called ___." },
        { "n": 23, "type": "fill_in", "blanks": 1, "prompt": "In general, dissolving anything in a liquid ___ the liquid's freezing temperature." },
        { "n": 24, "type": "true_false", "prompt": "True or false: Antifreeze works because dissolved substances raise water's freezing temperature." },
        { "n": 25, "type": "multiple_choice", "prompt": "Dissolved sugar or salt lowers water's freezing temperature because the 'foreign' molecules or ions", "options": [
          { "letter": "a", "text": "absorb the heat released by freezing" },
          { "letter": "b", "text": "get in the way of water molecules that would ordinarily join together into ice crystals" },
          { "letter": "c", "text": "raise the water's specific heat capacity" }
        ] }
      ]
    },
    {
      "id": "23.6",
      "label": "Boiling and Freezing at the Same Time",
      "pageStart": 456,
      "pageEnd": 457,
      "items": [
        { "n": 26, "type": "fill_in", "blanks": 1, "prompt": "Lowering the ___ can cause boiling and freezing to take place at the same time." },
        { "n": 27, "type": "fill_in", "blanks": 1, "prompt": "Drops of coffee sprayed into a vacuum chamber boil until they freeze; continued evaporation from the frozen drops is how freeze-___ coffee is made." },
        { "n": 28, "type": "true_false", "prompt": "True or false: When water boils in a vacuum jar at room temperature, the boiling warms the water left behind in the dish." },
        { "n": 29, "type": "multiple_choice", "prompt": "If the pressure in a jar above room-temperature water is slowly reduced by a vacuum pump, the water", "options": [
          { "letter": "a", "text": "starts to boil" },
          { "letter": "b", "text": "instantly freezes solid throughout" },
          { "letter": "c", "text": "stays completely unchanged" }
        ] }
      ]
    },
    {
      "id": "23.7",
      "label": "Regelation",
      "pageStart": 457,
      "pageEnd": 457,
      "items": [
        { "n": 30, "type": "fill_in", "blanks": 1, "prompt": "The phenomenon of melting under pressure and freezing again when the pressure is reduced is called ___." },
        { "n": 31, "type": "fill_in", "blanks": 1, "prompt": "Regelation can occur only in substances that ___ when they freeze." },
        { "n": 32, "type": "true_false", "prompt": "True or false: A fine wire supporting heavy weights will slowly cut through an ice block, but its track refills with ice, leaving the block in a single solid piece." },
        { "n": 33, "type": "multiple_choice", "prompt": "Making a snowball uses regelation: when you compress the snow, you", "options": [
          { "letter": "a", "text": "cause a slight melting that helps bind the snow into a ball" },
          { "letter": "b", "text": "freeze the snow into harder crystals" },
          { "letter": "c", "text": "raise the snow's temperature far above 0°C" }
        ] }
      ]
    },
    {
      "id": "23.8",
      "label": "Energy and Changes of Phase",
      "pageStart": 458,
      "pageEnd": 461,
      "items": [
        { "n": 34, "type": "fill_in", "blanks": 2, "prompt": "To melt a whole gram of ice at 0°C, ___ calories of heat must be absorbed; to vaporize a whole gram of boiling water takes ___ calories." },
        { "n": 35, "type": "fill_in", "blanks": 2, "prompt": "A solid ___ energy when it melts; a gas ___ energy when it liquefies." },
        { "n": 36, "type": "true_false", "prompt": "True or false: While ice is melting at 0°C, continued heat input raises the temperature of the ice-water mixture." },
        { "n": 37, "type": "true_false", "prompt": "True or false: Although molecules in steam and boiling water at 100°C have the same average kinetic energy, steam has more potential energy because its molecules are free of each other." },
        { "n": 38, "type": "multiple_choice", "prompt": "In a refrigerator, the refrigeration fluid draws heat from the food compartment when it", "options": [
          { "letter": "a", "text": "condenses in the coils at the back" },
          { "letter": "b", "text": "evaporates in the cooling unit" },
          { "letter": "c", "text": "freezes solid" }
        ] },
        { "n": 39, "type": "short_answer", "prompt": "Under what conditions will hot water freeze faster than warm water, and why?" }
      ]
    }
  ]$ch23$::jsonb,
  $ch23${
    "1": ["gas", "surface"],
    "2": ["cools"],
    "3": "false",
    "4": "b",
    "5": { "model": "As sweat evaporates, the faster-moving molecules leave, cooling the skin and helping maintain a stable body temperature." },
    "6": ["gas", "liquid"],
    "7": ["humidity"],
    "8": "true",
    "9": "false",
    "10": "b",
    "11": { "model": "Like a fly grazing flypaper at low speed, slow-moving molecules tend to stick together when they collide instead of bouncing apart." },
    "12": ["cooled", "warmed"],
    "13": ["equal"],
    "14": "true",
    "15": "c",
    "16": ["boiling"],
    "17": ["raises"],
    "18": "true",
    "19": "false",
    "20": "a",
    "21": { "model": "Boiling is a cooling process — heat is taken away by the escaping vapor as fast as it is added, so the temperature stays constant." },
    "22": ["freezing"],
    "23": ["lowers"],
    "24": "false",
    "25": "b",
    "26": ["pressure"],
    "27": ["dried"],
    "28": "false",
    "29": "a",
    "30": ["regelation"],
    "31": ["expand"],
    "32": "true",
    "33": "a",
    "34": ["80", "540"],
    "35": ["absorbs", "emits"],
    "36": "false",
    "37": "true",
    "38": "b",
    "39": { "model": "Water hotter than 80°C with a large evaporating surface area freezes faster, because each gram that rapidly evaporates draws at least 540 calories from the water left behind." }
  }$ch23$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();

INSERT INTO concept_exercises (chapter, title, text_pdf_url, page_offset, sections, answer_key)
VALUES (
  24,
  'Thermodynamics',
  'https://ymszffulqmkqgvhioege.supabase.co/storage/v1/object/public/lesson-media/cpte24.pdf',
  467,
  $ch24$[
    {
      "id": "24.1",
      "label": "Absolute Zero",
      "pageStart": 469,
      "pageEnd": 469,
      "items": [
        { "n": 1, "type": "fill_in", "blanks": 1, "prompt": "Absolute zero is the temperature at which no more ___ can be extracted from a substance and no further lowering of its temperature is possible." },
        { "n": 2, "type": "fill_in", "blanks": 1, "prompt": "Absolute zero corresponds to ___ degrees below zero on the Celsius scale." },
        { "n": 3, "type": "true_false", "prompt": "True or false: There are no negative numbers on the Kelvin (thermodynamic) scale." },
        { "n": 4, "type": "multiple_choice", "prompt": "Ice melts at 0°C. On the Kelvin scale, that temperature is", "options": [
          { "letter": "a", "text": "0 K" },
          { "letter": "b", "text": "273 K" },
          { "letter": "c", "text": "373 K" }
        ] },
        { "n": 5, "type": "short_answer", "prompt": "How did experimenters in the 1800s arrive at the value of absolute zero?" }
      ]
    },
    {
      "id": "24.2",
      "label": "First Law of Thermodynamics",
      "pageStart": 470,
      "pageEnd": 471,
      "items": [
        { "n": 6, "type": "fill_in", "blanks": 1, "prompt": "The first law of thermodynamics is the law of conservation of ___ applied to thermal systems." },
        { "n": 7, "type": "fill_in", "blanks": 2, "prompt": "Heat added to a system equals the increase in ___ energy of the system plus the external ___ done by the system." },
        { "n": 8, "type": "true_false", "prompt": "True or false: In the 1840s, James Joule demonstrated that the flow of heat is nothing more than the flow of energy itself." },
        { "n": 9, "type": "true_false", "prompt": "True or false: Adding heat is the only way to increase the internal energy of a system." },
        { "n": 10, "type": "multiple_choice", "prompt": "If air is heated in a rigid, airtight can of fixed volume, then", "options": [
          { "letter": "a", "text": "all of the heat increases the internal energy of the enclosed air, so its temperature rises" },
          { "letter": "b", "text": "all of the heat goes into doing external work" },
          { "letter": "c", "text": "the air's temperature stays the same" }
        ] },
        { "n": 11, "type": "short_answer", "prompt": "Why does a bicycle pump become hot when you pump the handle?" }
      ]
    },
    {
      "id": "24.3",
      "label": "Adiabatic Processes",
      "pageStart": 472,
      "pageEnd": 474,
      "items": [
        { "n": 12, "type": "fill_in", "blanks": 1, "prompt": "When a gas is compressed or expanded so that no heat enters or leaves the system, the process is said to be ___." },
        { "n": 13, "type": "fill_in", "blanks": 1, "prompt": "Measurements show that the temperature of a blob of dry air drops by about ___°C for each 1-kilometer increase in altitude." },
        { "n": 14, "type": "true_false", "prompt": "True or false: Diesel engines have no spark plugs because adiabatic compression raises the temperature high enough to ignite the fuel mixture." },
        { "n": 15, "type": "true_false", "prompt": "True or false: When a gas adiabatically expands, it becomes warmer." },
        { "n": 16, "type": "multiple_choice", "prompt": "A chinook — a warm, dry wind blowing down from the Rocky Mountains — is warm because the descending cold air is", "options": [
          { "letter": "a", "text": "heated by extra sunlight at high altitude" },
          { "letter": "b", "text": "compressed by the atmosphere into a smaller volume and appreciably warmed" },
          { "letter": "c", "text": "warmed by friction against the mountain slopes" }
        ] },
        { "n": 17, "type": "short_answer", "prompt": "Name one way an adiabatic change of volume can be achieved." }
      ]
    },
    {
      "id": "24.4",
      "label": "Second and Third Laws of Thermodynamics",
      "pageStart": 474,
      "pageEnd": 475,
      "items": [
        { "n": 18, "type": "fill_in", "blanks": 2, "prompt": "The second law of thermodynamics states that heat will never of itself flow from a ___ object to a ___ object." },
        { "n": 19, "type": "fill_in", "blanks": 1, "prompt": "The third law of thermodynamics states that no system can reach absolute ___." },
        { "n": 20, "type": "true_false", "prompt": "True or false: If a hot brick took heat from a cold brick and became hotter, the first law of thermodynamics would be violated." },
        { "n": 21, "type": "multiple_choice", "prompt": "Heat can be made to flow from cold to hot", "options": [
          { "letter": "a", "text": "never, under any circumstances" },
          { "letter": "b", "text": "only by imposing external effort, as with a heat pump or air conditioner" },
          { "letter": "c", "text": "whenever the cold object is large enough" }
        ] },
        { "n": 22, "type": "short_answer", "prompt": "There is a huge amount of internal energy in the ocean. Why can't this energy be used to light a single flashlight lamp?" }
      ]
    },
    {
      "id": "24.5",
      "label": "Heat Engines and the Second Law",
      "pageStart": 475,
      "pageEnd": 478,
      "items": [
        { "n": 23, "type": "fill_in", "blanks": 1, "prompt": "A heat engine is any device that changes internal energy into mechanical ___." },
        { "n": 24, "type": "fill_in", "blanks": 1, "prompt": "When the heat expelled by an engine is undesirable, we call it thermal ___." },
        { "n": 25, "type": "true_false", "prompt": "True or false: Even without friction, a heat engine can convert only some of its heat input to work." },
        { "n": 26, "type": "true_false", "prompt": "True or false: Whenever ratios of temperatures are involved, as in the equation for ideal efficiency, the absolute temperature scale must be used." },
        { "n": 27, "type": "multiple_choice", "prompt": "Every heat engine will (1) absorb heat from a reservoir of higher temperature, (2) convert some of this energy into mechanical work, and (3)", "options": [
          { "letter": "a", "text": "expel the remaining energy as heat to some lower-temperature reservoir" },
          { "letter": "b", "text": "destroy the remaining energy" },
          { "letter": "c", "text": "convert the remaining energy into entropy and store it" }
        ] },
        { "n": 28, "type": "short_answer", "prompt": "A steam turbine's hot reservoir is 400 K and its sink (exhaust) is 300 K. What is its ideal efficiency?" }
      ]
    },
    {
      "id": "24.6",
      "label": "Order Tends to Disorder",
      "pageStart": 479,
      "pageEnd": 479,
      "items": [
        { "n": 29, "type": "fill_in", "blanks": 1, "prompt": "Whenever energy transforms, some of it degenerates into waste ___, unavailable to do work." },
        { "n": 30, "type": "fill_in", "blanks": 1, "prompt": "Natural systems tend to proceed toward a state of greater ___." },
        { "n": 31, "type": "true_false", "prompt": "True or false: Disordered energy can be changed to ordered energy only at the expense of work input." },
        { "n": 32, "type": "multiple_choice", "prompt": "When a jar of argon gas is opened in the corner of a room, the argon atoms", "options": [
          { "letter": "a", "text": "stay concentrated in the jar" },
          { "letter": "b", "text": "mix with the air, moving from a more ordered state to a more disordered state" },
          { "letter": "c", "text": "spontaneously return to the jar after mixing" }
        ] }
      ]
    },
    {
      "id": "24.7",
      "label": "Entropy",
      "pageStart": 480,
      "pageEnd": 481,
      "items": [
        { "n": 33, "type": "fill_in", "blanks": 1, "prompt": "Entropy is the measure of the amount of ___ in a system." },
        { "n": 34, "type": "fill_in", "blanks": 1, "prompt": "According to the second law of thermodynamics, in the long run the entropy of a system always ___ for natural processes." },
        { "n": 35, "type": "true_false", "prompt": "True or false: The second law is a probability statement — given enough time, entropy may sometimes spontaneously decrease, though the odds are infinitesimally small." },
        { "n": 36, "type": "multiple_choice", "prompt": "Living things decrease their own entropy by", "options": [
          { "letter": "a", "text": "violating the second law of thermodynamics" },
          { "letter": "b", "text": "extracting energy from their surroundings, so 'life forms plus their waste products' still shows a net increase in entropy" },
          { "letter": "c", "text": "avoiding all energy transformations" }
        ] },
        { "n": 37, "type": "short_answer", "prompt": "State the playful 'you can't win' version of the laws of thermodynamics given at the end of the section." }
      ]
    }
  ]$ch24$::jsonb,
  $ch24${
    "1": ["energy"],
    "2": ["273"],
    "3": "true",
    "4": "b",
    "5": { "model": "They discovered that all gases contract by the same proportion when temperature is decreased, pointing to a lower limit of -273°C." },
    "6": ["energy"],
    "7": ["internal", "work"],
    "8": "true",
    "9": "false",
    "10": "a",
    "11": { "model": "Pumping puts mechanical work into the system, raising the internal energy of the air — its temperature rises without any heat input." },
    "12": ["adiabatic"],
    "13": ["10"],
    "14": "true",
    "15": "false",
    "16": "b",
    "17": { "model": "Perform the process rapidly so heat has little time to enter or leave, or thermally insulate the system from its surroundings." },
    "18": ["cold", "hot"],
    "19": ["zero"],
    "20": "false",
    "21": "b",
    "22": { "model": "Energy will not of itself flow from the lower-temperature ocean to the higher-temperature lamp filament — that would require external effort." },
    "23": ["work"],
    "24": ["pollution"],
    "25": "true",
    "26": "true",
    "27": "a",
    "28": { "model": "Ideal efficiency = (400 K - 300 K)/400 K = 1/4, so only 25% of the input energy can ideally be converted to work." },
    "29": ["heat"],
    "30": ["disorder"],
    "31": "true",
    "32": "b",
    "33": ["disorder"],
    "34": ["increases"],
    "35": "true",
    "36": "b",
    "37": { "model": "You can't win (you can't get more energy out than you put in), you can't break even (you can't even get as much out as you put in), and you can't get out of the game (entropy in the universe is always increasing)." }
  }$ch24$::jsonb
)
ON CONFLICT (chapter) DO UPDATE SET
  title = EXCLUDED.title,
  text_pdf_url = EXCLUDED.text_pdf_url,
  page_offset = EXCLUDED.page_offset,
  sections = EXCLUDED.sections,
  answer_key = EXCLUDED.answer_key,
  updated_at = now();
