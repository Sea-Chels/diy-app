import type { Guide } from '../guides';

export const WATER_GUIDES: Guide[] = [
  {
    id: 'rain-barrel', title: 'Install a rain barrel', areas: ['water'], aliases: ['rain water', 'downspout', 'water butt', 'harvest rainwater'],
    kind: 'build', difficulty: 2, minutes: [60, 120], savings: 'one inch of rain on a 10×10 roof fills a 55-gallon barrel',
    tools: ['Drill with hole saw', 'Hacksaw', 'Level', 'Screwdriver'],
    supplies: ['Food-grade barrel with lid (or a kit)', 'Spigot and bulkhead fitting', 'Overflow fitting and hose', 'Downspout diverter or flexible elbow', 'Fine mesh screen', 'Cinder blocks or a sturdy stand'],
    summary: 'Divert a downspout into a barrel raised on blocks so gravity can feed a hose. Plants love soft rainwater, and blueberries especially.',
    steps: [
      'Check local rules; a few places limit rain collection.',
      'Build a level, solid base: a full 55-gallon barrel weighs over 450 lb. Raise it at least 12–16 inches for water pressure.',
      'Fit the spigot near the bottom and an overflow near the top, sealing with the bulkhead washers.',
      'Cover every opening with fine mesh so mosquitoes can\'t breed.',
      'Cut the downspout and fit a diverter, or an elbow into the screened lid.',
      'Run the overflow hose at least 6 ft away from foundations.',
      'Empty and disconnect before freezing weather.',
    ],
    cautions: ['Use rainwater at the base of food plants rather than over leafy greens close to harvest; roofs collect bird droppings and debris.', 'Secure the lid if children are around.'],
    query: 'how to install a rain barrel downspout diverter',
  },
  {
    id: 'drip-irrigation', title: 'Lay a drip line with a timer', areas: ['water', 'bed', 'kitchen'], aliases: ['drip irrigation', 'soaker hose', 'watering system', 'timer', 'emitters', 'automatic watering'],
    kind: 'build', difficulty: 2, minutes: [60, 180], savings: 'uses 30–50% less water than a sprinkler',
    tools: ['Hole punch for drip tubing', 'Pruners to cut tubing'],
    supplies: ['Faucet timer', 'Backflow preventer, filter and pressure regulator (25 psi)', '½ in mainline tubing', '¼ in emitter line or inline drip tubing with emitters every 6–12 in', 'Fittings, end caps, stakes'],
    summary: 'Drip lines put water at the roots, keep leaves dry (less disease) and run on a timer, so watering happens even when you forget.',
    steps: [
      'At the faucet, connect in order: timer, backflow preventer, filter, pressure regulator, then the ½ in mainline.',
      'Run the mainline to each bed; punch holes and plug in ¼ in lines or connect inline drip tubing.',
      'Lay drip lines 12 inches apart across beds, or loop one around each big plant.',
      'Cap the ends and flush the lines before closing them.',
      'Run it and check the soil: aim for moist 6 inches down. Start with 30–60 minutes, 2–3 times a week, then adjust.',
      'Cover the lines with mulch.',
    ],
    query: 'drip irrigation raised beds install timer', featured: true,
  },
  {
    id: 'watering', title: 'How much and when to water', areas: ['water'], aliases: ['watering', 'wilting', 'overwatering', 'how often', 'dry soil'],
    kind: 'grow', difficulty: 1, minutes: [5, 20],
    tools: ['Rain gauge or tuna can', 'Your finger'], supplies: ['Mulch'],
    summary: 'Most vegetables need about 1 inch of water a week (rain included), given deeply and less often so roots grow down.',
    steps: [
      'Push a finger into the soil: if it\'s dry 2 inches down, water.',
      'Water in the morning at the base of plants.',
      'Water long enough to soak 6 inches deep. Place a tuna can under a sprinkler to time 1 inch.',
      'Containers and hanging baskets dry fast and may need daily water in summer.',
      'Wilting at midday on a hot day is normal; wilting in the morning means it\'s thirsty (or has root problems if the soil is wet).',
    ],
    query: 'how much to water vegetable garden deep watering',
  },
];
