import type { Plant } from '../plants';
import { BRASSICAS } from './common';

export const FLOWERS_PLANTS: Plant[] = [
  {
    id: 'marigold', name: 'French marigold', latin: 'Tagetes patula', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 8, height: '6–12 in',
    sow: 'Start indoors 6 weeks before last frost or direct sow after frost.', days: '50 days to flower',
    care: ['Deadhead for nonstop blooms.', 'French marigold roots release compounds that suppress some root-knot nematodes when grown densely for a season.'],
    harvest: 'Save seeds from dried heads for next year.', problems: ['Spider mites in drought', 'Slugs on seedlings'],
    friends: ['tomato', 'pepper', 'eggplant', 'pumpkin', 'zucchini', 'beans', 'potato', 'cucumber'], avoid: [], area: 'kitchen',
  },
  {
    id: 'nasturtium', name: 'Nasturtium', latin: 'Tropaeolum majus', type: 'flower', life: 'annual', sun: 'full', water: 'low', spacing: 12, height: '1 ft (trailing to 6 ft)',
    sow: 'Direct sow after last frost; soak the big seeds overnight.', days: '50 days to flower',
    care: ['Poor soil gives more flowers; rich soil gives more leaves.', 'A trap crop: aphids and flea beetles go for it instead of your veg.'],
    harvest: 'Leaves and flowers are edible and peppery; green seed pods make "poor man\'s capers".', problems: ['Black aphids (that\'s its job)'],
    friends: ['pumpkin', 'zucchini', 'cucumber', ...BRASSICAS, 'tomato', 'apple'], avoid: [], area: 'kitchen',
  },
  {
    id: 'sunflower', name: 'Sunflower', latin: 'Helianthus annuus', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '3–12 ft',
    sow: 'Direct sow 1 inch deep after last frost; protect seedlings from birds and slugs.', days: '70–100 days',
    care: ['Stake giant types in windy spots.', 'Young heads track the sun; mature heads face east.'],
    harvest: 'When the back of the head turns yellow-brown, cut with a foot of stem and hang to dry; cover with a paper bag to beat the birds.',
    problems: ['Birds and squirrels', 'Sunflower moth'], friends: ['corn', 'cucumber', 'pumpkin', 'zucchini'], avoid: ['potato', 'beans'], area: 'pollinators',
  },
  {
    id: 'zinnia', name: 'Zinnia', latin: 'Zinnia elegans', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '1–4 ft',
    sow: 'Direct sow after last frost; they grow fast in warm soil.', days: '60–70 days to flower',
    care: ['The more you cut, the more they bloom.', 'Space well for airflow against mildew.'], harvest: 'Cut when stems are stiff just below the flower (the "wiggle test").',
    problems: ['Powdery mildew'], friends: ['tomato', 'beans', 'cucumber'], avoid: [], area: 'pollinators',
  },
  {
    id: 'cosmos', name: 'Cosmos', latin: 'Cosmos bipinnatus', type: 'flower', life: 'annual', sun: 'full', water: 'low', spacing: 12, height: '3–5 ft',
    sow: 'Direct sow after last frost; thrives in poor soil.', days: '60–90 days to flower',
    care: ['No fertilizer needed. Self-seeds.'], harvest: 'Cut when buds just open for long-lasting bouquets.',
    problems: ['Flops in rich soil'], friends: ['tomato', 'cucumber', 'beans'], avoid: [], area: 'pollinators',
  },
  {
    id: 'borage', name: 'Borage', latin: 'Borago officinalis', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '2–3 ft',
    sow: 'Direct sow after last frost; self-seeds forever after.', days: '50 days to flower',
    care: ['One of the best bee plants there is.', 'Brittle stems: give it a sheltered spot.'], harvest: 'The star-shaped blue flowers are edible (cucumber flavor) in salads and ice cubes.',
    problems: ['Self-seeds widely'], friends: ['tomato', 'strawberry', 'pumpkin', 'zucchini', 'cucumber'], avoid: [],
  },
  {
    id: 'alyssum', name: 'Sweet alyssum', latin: 'Lobularia maritima', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: '4–6 in',
    sow: 'Surface-sow in early spring; tolerates light frost.', days: '50 days to flower',
    care: ['Shear back in a summer slump and it reblooms.', 'Tiny flowers feed hoverflies whose larvae eat aphids.'], harvest: '—',
    problems: ['Heat slump'], friends: ['lettuce', ...BRASSICAS, 'potato'], avoid: [],
  },
  {
    id: 'beebalm', name: 'Bee balm', latin: 'Monarda didyma', type: 'flower', life: 'perennial', zones: [4, 9], sun: 'full', water: 'medium', spacing: 24, height: '2–4 ft',
    sow: 'Plant divisions in spring.', days: 'Flowers year 1',
    care: ['Divide every 3 years. Choose mildew-resistant varieties.'], harvest: 'Leaves and flowers make a minty tea.',
    problems: ['Powdery mildew', 'Spreads'], friends: ['tomato', 'echinacea'], avoid: [], area: 'pollinators',
  },
  {
    id: 'yarrow', name: 'Yarrow', latin: 'Achillea millefolium', type: 'flower', life: 'perennial', zones: [3, 9], sun: 'full', water: 'low', spacing: 18, height: '1–3 ft',
    sow: 'Plant in spring; thrives on neglect.', days: 'Flowers year 1',
    care: ['Flat flower heads are landing pads for predatory wasps and ladybugs.'], harvest: 'Cut flowers for drying when fully open.',
    problems: ['Floppy in rich soil'], friends: [...BRASSICAS, 'echinacea'], avoid: [],
  },
  {
    id: 'rose', name: 'Climbing rose', latin: 'Rosa spp.', type: 'flower', life: 'shrub', zones: [5, 9], sun: 'full', water: 'medium', spacing: 72, height: '8–15 ft',
    sow: 'Plant bare-root roses in early spring with the graft union at or just below the soil surface (deeper in cold zones).', days: 'Flowers year 1–2',
    care: ['Tie long canes sideways along the arbor: horizontal canes flower more.', 'Prune in late winter: remove dead wood and shorten side shoots to 2–3 buds.', 'Water at the base; wet leaves invite black spot.'],
    harvest: 'Leave the last flush of flowers to form hips for winter interest and rosehip tea.', problems: ['Black spot', 'Japanese beetles', 'Aphids'],
    friends: ['garlic', 'chives', 'lavender'], avoid: [], area: 'arbor',
  },
  {
    id: 'clematis', name: 'Clematis', latin: 'Clematis spp.', type: 'flower', life: 'vine', zones: [4, 9], sun: 'full', water: 'medium', spacing: 36, height: 'Vines 6–12 ft',
    sow: 'Plant in spring with the crown 2–3 inches deep; "head in the sun, feet in the shade" (mulch or low plants over the roots).', days: 'Flowers year 1–2',
    care: ['Pruning depends on its group (1, 2 or 3): check the label before you cut.'], harvest: '—',
    problems: ['Clematis wilt', 'Slugs on new shoots'], friends: ['rose'], avoid: [], area: 'tools',
  },
];
