import type { Guide } from '../guides';

export const TUNNEL_GUIDES: Guide[] = [
  {
    id: 'hoop-tunnel', title: 'Build a low hoop tunnel', spots: ['tunnel'], aliases: ['row cover', 'hoops', 'mini greenhouse', 'frost cloth', 'insect netting', 'season extension'],
    kind: 'build', difficulty: 1, minutes: [30, 60], savings: 'a fraction of a cold frame or greenhouse',
    tools: ['Hacksaw', 'Drill'], supplies: ['½ in PVC conduit or 9-gauge wire hoops', 'Pipe straps or rebar stakes', 'Row cover (frost cloth) and/or insect netting', 'Clips and sandbags'],
    summary: 'Hoops over a bed carry row cover in spring and fall for frost protection, or insect netting in summer to keep cabbage moths and beetles off. Roll the cover back on warm days.',
    steps: [
      'Cut hoops long enough to arch about 18–24 inches over the plants.',
      'Fix pipe straps on the inside of the bed walls every 3–4 ft (or push rebar stakes into the ground) and slot the hoops in.',
      'Drape row cover over the hoops, leaving extra at each end.',
      'Clip the cover to the hoops and weigh the edges with sandbags, or gather the ends and stake them.',
      'Vent on sunny days over 70°F; open completely when crops that need bees start flowering.',
    ],
    plants: ['cabbage', 'kale', 'lettuce', 'broccoli'], query: 'low tunnel hoop house raised bed row cover',
  },
  {
    id: 'frost-protect', title: 'Frost is forecast', spots: ['tunnel', 'seedlings'], aliases: ['frost', 'freeze', 'cold snap', 'late frost', 'cover plants'],
    kind: 'fix', difficulty: 1, minutes: [15, 30],
    tools: ['Hose'], supplies: ['Row cover, old sheets or buckets', 'Clothespins and stones'],
    summary: 'A light frost (around 32°F) kills tender plants like tomatoes, basil and squash, while kale and spinach shrug it off. Covers trap the ground\'s warmth overnight.',
    steps: [
      'Water the soil in the afternoon; moist soil holds more heat.',
      'Before sunset cover tender plants with row cover or sheets reaching the ground. Avoid plastic touching leaves.',
      'Weigh the edges down so the warm air can\'t escape.',
      'Remove covers in the morning once it\'s above freezing.',
      'Bring potted plants and seedlings indoors.',
    ],
    query: 'protect garden plants from frost row cover',
  },
  {
    id: 'cabbage-worms', title: 'Holes in cabbage and kale', spots: ['tunnel', 'bed'], aliases: ['cabbage worm', 'green caterpillar', 'white butterfly', 'brassica', 'holes in leaves', 'loopers'],
    kind: 'fix', difficulty: 1, minutes: [15, 30],
    tools: ['Your eyes'], supplies: ['Fine insect netting', 'Bt (Bacillus thuringiensis)'],
    summary: 'Small white butterflies fluttering over your brassicas are laying eggs. The velvety green caterpillars chew ragged holes and leave dark green droppings.',
    steps: [
      'Pick off caterpillars and the tiny yellow eggs under leaves.',
      'Cover plants with insect netting on hoops from planting time; seal the edges.',
      'Spray Bt on leaves for a bad outbreak; it only harms caterpillars.',
      'Plant dill, alyssum and other small flowers to feed the wasps that parasitise them.',
    ],
    plants: ['cabbage', 'kale', 'broccoli', 'collards'], query: 'cabbage worms organic control netting bt',
  },
  {
    id: 'winter-greens', title: 'Grow greens through fall and winter', spots: ['tunnel'], aliases: ['winter garden', 'cold frame', 'fall garden', 'season extension'],
    kind: 'grow', difficulty: 2, minutes: [30, 60],
    tools: ['Hoop tunnel or cold frame'], supplies: ['Cold-hardy seed: spinach, kale, mâche, arugula, lettuce \'Winter Density\''],
    summary: 'Sow hardy greens in late summer, then cover them. Growth stops in the short days of winter, but they hold in the tunnel and you keep picking.',
    steps: [
      'Count back: sow 6–10 weeks before first frost so plants are nearly full size when days drop below 10 hours.',
      'Cover with row cover when nights dip below freezing; add a second layer or plastic in deep cold.',
      'Vent on sunny days.',
      'Harvest outer leaves on mild afternoons, when they\'re not frozen.',
    ],
    plants: ['spinach', 'kale', 'arugula', 'lettuce'], query: 'winter growing greens low tunnel fall planting',
  },
];
