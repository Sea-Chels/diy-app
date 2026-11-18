import type { Guide } from '../guides';

export const SEEDLINGS_GUIDES: Guide[] = [
  {
    id: 'start-seeds', title: 'Start seeds indoors', areas: ['seedlings'], aliases: ['seed starting', 'grow light', 'trays', 'germinate', 'when to start seeds'],
    kind: 'grow', difficulty: 1, minutes: [30, 60], wait: '6–10 weeks until transplanting', savings: 'a 6-pack of transplants costs about the same as a packet of 30 seeds',
    tools: ['Seed trays or cell packs with drainage', 'Shop light or LED grow light on a timer', 'Spray bottle', 'Heat mat (for peppers and tomatoes)'],
    supplies: ['Fresh seed-starting mix (not garden soil)', 'Seeds', 'Labels'],
    summary: 'Start tomatoes, peppers, brassicas and herbs inside 6–10 weeks before your last frost and you\'ll have more varieties for less money.',
    steps: [
      'Look up your last frost date and count back using the seed packet.',
      'Moisten seed-starting mix until it feels like a wrung-out sponge and fill the cells.',
      'Sow 2 seeds per cell at a depth of 2–3 times the seed\'s width; label every tray.',
      'Cover with a dome or plastic and keep warm (75–80°F for peppers).',
      'As soon as sprouts appear, remove the cover and put lights 2–4 inches above the seedlings, on 14–16 hours a day.',
      'Snip the weaker seedling in each cell. Water from below.',
      'Run a fan on low for a few hours a day to toughen stems; feed with half-strength fertilizer after the first true leaves.',
    ],
    query: 'how to start seeds indoors grow lights beginner', featured: true,
  },
  {
    id: 'leggy-seedlings', title: 'Seedlings are leggy or keel over', areas: ['seedlings'], aliases: ['leggy', 'damping off', 'stretched', 'falling over', 'seedlings dying'],
    kind: 'fix', difficulty: 1, minutes: [10, 20],
    tools: ['Grow light', 'Fan'], supplies: ['Fresh seed-starting mix', 'Clean trays'],
    summary: 'Pale, stretched seedlings are reaching for light. Seedlings that pinch at the soil line and collapse have damping-off, a fungus from cold, wet, stale mix.',
    steps: [
      'Leggy: move lights to 2–4 inches above the leaves and keep them on 14–16 hours. A sunny window is rarely enough.',
      'Re-pot leggy tomatoes deeper: they root along the stem.',
      'Damping off: throw out affected cells. Water from below and let the surface dry between waterings.',
      'Add a fan for airflow and stop using a humidity dome after germination.',
      'Next time use fresh mix and wash trays in a 1:10 bleach solution.',
    ],
    query: 'fix leggy seedlings damping off prevention',
  },
  {
    id: 'harden-off', title: 'Harden off and transplant', areas: ['seedlings', 'kitchen'], aliases: ['hardening off', 'transplant shock', 'plant out', 'acclimate'],
    kind: 'grow', difficulty: 1, minutes: [10, 30], wait: '7–10 days of gradual exposure',
    tools: ['Trowel', 'Watering can'], supplies: ['Diluted seaweed or fish emulsion (optional)'],
    summary: 'Indoor seedlings sunburn and wilt if planted straight out. Introduce them to sun, wind and cool nights over a week.',
    steps: [
      'Day 1–2: set trays in shade outside for 1–2 hours.',
      'Day 3–5: lengthen to half a day with some morning sun.',
      'Day 6–8: full sun most of the day; leave out overnight if it stays above 50°F (45°F for brassicas).',
      'Transplant on a cloudy day or in the evening. Water the plants an hour before and again after planting.',
      'Shade with row cover for a couple of days if it\'s hot.',
    ],
    query: 'how to harden off seedlings transplant',
  },
  {
    id: 'save-seeds', title: 'Save your own seeds', areas: ['seedlings', 'pantry'], aliases: ['seed saving', 'heirloom', 'tomato seeds ferment', 'bean seeds'],
    kind: 'preserve', difficulty: 2, minutes: [20, 60], wait: 'Tomato seeds ferment 2–4 days; all seed dries 1–2 weeks',
    tools: ['Jars', 'Strainer', 'Paper plates', 'Envelopes'], supplies: ['Labels'],
    summary: 'Save seed from open-pollinated or heirloom varieties (hybrids labelled F1 won\'t come true). Beans, peas, tomatoes and lettuce are the easiest.',
    steps: [
      'Beans and peas: leave pods on the plant until dry and rattling, then shell.',
      'Tomatoes: squeeze seeds and gel from ripe fruit into a jar with a little water. Leave 2–4 days until a mould forms on top.',
      'Rinse tomato seeds in a strainer; the good seeds sink. Dry on a paper plate.',
      'Dry all seed somewhere airy out of the sun for 1–2 weeks.',
      'Store in labelled envelopes in a jar in a cool, dark place. Most last 3–5 years.',
    ],
    plants: ['tomato', 'beans', 'peas', 'lettuce'], query: 'how to save tomato seeds fermentation bean seeds',
  },
];
