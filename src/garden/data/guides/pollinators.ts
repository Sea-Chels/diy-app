import type { Guide } from '../guides';
import { EXTENSION } from './common';

export const POLLINATORS_GUIDES: Guide[] = [
  {
    id: 'pollinator-patch', title: 'Plant a pollinator patch', spots: ['pollinators'], aliases: ['bees', 'butterflies', 'pollinators', 'native plants', 'beneficial insects'],
    kind: 'grow', difficulty: 1, minutes: [60, 120],
    tools: ['Trowel', 'Shovel'], supplies: ['A mix of flowers blooming spring to fall', 'Native perennials from a local nursery', 'A shallow dish with pebbles for water'],
    summary: 'More pollinators means more squash, cucumbers, berries and fruit. Plant clumps of different flower shapes that bloom from early spring to late fall.',
    steps: [
      'Plant in clumps of 3 or more of each flower; bees forage efficiently on big patches.',
      'Mix shapes: flat (yarrow, zinnia) for hoverflies, tubes (bee balm) for hummingbirds, open daisies (echinacea, cosmos) for bees.',
      'Cover the whole season: crocus and fruit blossom in spring, sunflowers and zinnias in summer, asters and goldenrod in fall.',
      'Leave some bare soil and hollow stems: most native bees nest in the ground or in stems.',
      'Add a shallow water dish with stones to land on.',
      'Skip broad-spectrum insecticides, and never spray open flowers.',
    ],
    plants: ['sunflower', 'zinnia', 'cosmos', 'borage', 'echinacea', 'beebalm'], query: 'pollinator garden plants bees butterflies vegetable garden',
  },
  {
    id: 'bee-hotel', title: 'Build a bee hotel', spots: ['pollinators'], aliases: ['mason bee', 'solitary bees', 'insect hotel', 'bee house'],
    kind: 'build', difficulty: 1, minutes: [45, 90],
    tools: ['Drill with 5/16 in (8 mm) brad-point bit', 'Saw'],
    supplies: ['Untreated wood block or box with a roof overhang', 'Paper tubes or reeds (5/16 in, 6 in long), or drilled holes 6 in deep', 'A post or wall bracket'],
    summary: 'Mason and leafcutter bees are gentle, solitary pollinators that nest in holes. A hotel with removable tubes keeps them healthy year after year.',
    steps: [
      'Use holes or tubes about 5/16 in wide and 6 in deep, closed at the back. Smooth inner walls; no splinters.',
      'Prefer removable paper liners or reeds so you can replace them each year and stop mites and fungus building up.',
      'Mount it 3–6 ft high facing east or south-east for morning sun, sheltered from rain.',
      'Have mud nearby (mason bees seal their cells with it).',
      'In fall, store filled tubes in a cool, dry, rodent-proof box and put out fresh tubes in spring.',
    ],
    cautions: ['Skip the big "insect hotels" stuffed with pine cones: they mostly house earwigs and spread disease.'],
    query: 'how to build a mason bee house removable tubes',
  },
  {
    id: 'aphids', title: 'Aphids on new growth', spots: ['pollinators', 'tunnel', 'kitchen'], aliases: ['aphids', 'sticky leaves', 'curled leaves', 'greenfly', 'ants on plants'],
    kind: 'fix', difficulty: 1, minutes: [10, 20],
    tools: ['Hose with a jet nozzle'], supplies: ['Insecticidal soap (optional)'],
    summary: 'Clusters of soft green, black or gray insects on tips and under leaves. Natural predators usually catch up within a couple of weeks if you don\'t spray them away.',
    steps: [
      'Blast aphids off with a strong jet of water every couple of days.',
      'Squish small clusters by hand.',
      'Look for ladybug and lacewing larvae and hoverfly maggots before acting: they\'re already on it.',
      'For heavy infestations spray insecticidal soap, covering the undersides; it only works on contact.',
      'Ease up on high-nitrogen fertilizer, which grows the soft shoots aphids love.',
      'Control ants, which farm aphids for their honeydew.',
    ],
    query: 'aphids organic control garden',
  },
  {
    id: 'organic-pest-control', title: 'Organic pest control basics (IPM)', spots: ['pollinators', 'kitchen', 'tunnel'], aliases: ['ipm', 'pests', 'bugs', 'slugs', 'beetles', 'neem', 'organic spray'],
    kind: 'grow', difficulty: 1, minutes: [15, 30],
    tools: ['Hand lens', 'Notebook'], supplies: ['Row cover', 'Beer traps or iron phosphate slug bait', 'Insecticidal soap, Bt, neem (as last resorts)'],
    summary: 'Integrated pest management means preventing problems, identifying the pest before acting, and starting with the gentlest fix.',
    steps: [
      'Prevent: healthy soil, right plant in the right place, crop rotation, resistant varieties.',
      'Exclude: row covers and netting stop most flying pests.',
      'Identify: confirm the culprit (Extension offices identify bugs for free) and tolerate a little damage.',
      'Act gently first: hand-pick, trap, blast with water.',
      'Then targeted organic products (Bt for caterpillars, soap for aphids), applied in the evening when bees are gone.',
    ],
    links: [EXTENSION], query: 'integrated pest management vegetable garden organic',
  },
];
