import type { Guide } from '../guides';

export const FRUIT_GUIDES: Guide[] = [
  {
    id: 'plant-pawpaw', title: 'Plant and pollinate pawpaws', spots: ['fruit'], aliases: ['pawpaw', 'asimina', 'native fruit', 'paw paw', 'hand pollinate'],
    kind: 'grow', difficulty: 2, minutes: [60, 120], wait: '3–7 years to first fruit',
    tools: ['Shovel', 'Small paintbrush (for pollinating)'], supplies: ['Two different pawpaw varieties or seedlings (container grown)', 'Tree tubes or shade cloth', 'Mulch'],
    summary: 'Pawpaws are native, pest-resistant and taste tropical. The tricks: shade them while young, never disturb the taproot, and plant two genetically different trees.',
    steps: [
      'Buy two container-grown trees of different varieties (or seedlings from different sources) and plant them 8–20 ft apart in spring.',
      'Dig a wide hole, keep the root ball intact and plant at the same depth it grew. Water deeply.',
      'Shade young trees for the first 1–2 years with a tree tube, shade cloth or a sunny spot that gets afternoon shade.',
      'Mulch widely and keep evenly moist.',
      'Once trees flower, hand-pollinate: brush pollen from a flower whose anthers are brown and crumbly onto the green stigma of a flower on the other tree.',
      'Harvest when fruit gives to gentle pressure and smells sweet. Ripe fruit lasts 2–3 days at room temperature; refrigerate or freeze the pulp.',
    ],
    plants: ['pawpaw'], query: 'how to grow pawpaw trees pollination',
  },
  {
    id: 'blueberries', title: 'Grow blueberries in acid soil', spots: ['fruit'], aliases: ['blueberry', 'acid soil', 'sulfur', 'ph', 'yellow leaves blueberry', 'container blueberries'],
    kind: 'grow', difficulty: 2, minutes: [60, 120], wait: 'Lower pH 6–12 months ahead if planting in the ground',
    tools: ['Shovel', 'Soil test kit'], supplies: ['Two or more blueberry varieties suited to your zone', 'Elemental sulfur (for in-ground)', 'Peat moss or composted pine bark', 'Pine bark or pine needle mulch', 'Acid-loving plant fertilizer'],
    summary: 'Blueberries need acidic soil, around pH 4.5–5.5. In most gardens that means amending the soil a season ahead, or growing in a big container or half barrel of acidic mix.',
    steps: [
      'Test soil pH. Above 5.5, mix in elemental sulfur at the rate the test suggests, ideally a season before planting.',
      'Or fill a 20+ gallon pot or half barrel with a mix of pine bark fines and peat.',
      'Plant two varieties that bloom together for better crops. Set them at the depth they grew.',
      'Mulch 3–4 inches deep with pine bark or needles.',
      'Water with rainwater if your tap water is hard; keep evenly moist.',
      'Pick off flowers the first year. Feed lightly with an acid fertilizer in spring.',
      'Cover with bird netting as berries color.',
    ],
    plants: ['blueberry'], query: 'how to grow blueberries acidic soil container',
  },
  {
    id: 'prune-berries', title: 'Prune fruit bushes in late winter', spots: ['fruit', 'tools'], aliases: ['pruning', 'goji', 'blueberry', 'raspberry', 'currant', 'dormant pruning'],
    kind: 'grow', difficulty: 2, minutes: [20, 60],
    tools: ['Sharp bypass pruners', 'Loppers', 'Rubbing alcohol to clean blades'], supplies: [],
    summary: 'Dormant pruning in late winter keeps bushes young, open and productive. Remove the 3 Ds first: dead, damaged and diseased wood.',
    steps: [
      'Clean your blades between plants.',
      'Cut out dead, damaged and diseased wood, and any branches that cross or rub.',
      'Blueberries: remove one or two of the oldest canes (over 6 years) at the base each year.',
      'Goji: keep 3–5 main stems, shorten long whips by a third to make fruiting side shoots, and remove suckers.',
      'Raspberries: cut summer-bearers\' fruited canes to the ground; mow fall-bearers to the ground.',
      'Cut just above an outward-facing bud at a slight angle.',
    ],
    plants: ['blueberry', 'goji', 'raspberry', 'currant'], query: 'pruning blueberry bushes goji late winter',
  },
  {
    id: 'birds-berries', title: 'Birds are eating all the fruit', spots: ['fruit'], aliases: ['bird netting', 'birds', 'squirrels', 'protect berries'],
    kind: 'fix', difficulty: 1, minutes: [20, 45],
    tools: ['Stakes or PVC hoops'], supplies: ['Bird netting with small mesh', 'Clothespins or zip ties'],
    summary: 'Birds find berries the day they color. Netting over a frame works far better than scare tape or owls.',
    steps: [
      'Build a simple frame of stakes or hoops so the net doesn\'t lie on the plant (birds peck through).',
      'Drape netting over it as soon as fruit starts coloring.',
      'Close the bottom completely with pins or stakes; birds walk in under gaps.',
      'Check daily for trapped birds and remove nets after harvest.',
    ],
    plants: ['blueberry', 'strawberry', 'goji', 'raspberry'], query: 'bird netting blueberries frame',
  },
];
