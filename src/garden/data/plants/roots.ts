import type { Plant } from '../plants';
import { BRASSICAS } from './common';

export const ROOTS_PLANTS: Plant[] = [
  {
    id: 'potato', name: 'Potato', latin: 'Solanum tuberosum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '2–3 ft', ph: '5.0–6.0',
    sow: 'Plant chitted seed potatoes 4 inches deep 2–4 weeks before last frost.', days: '70–120 days',
    care: ['Hill soil or straw up the stems as they grow so tubers stay dark (green potatoes are toxic).', 'Grow bags or a tower save space.'],
    harvest: 'Dig new potatoes when plants flower; storage potatoes two weeks after the tops die. Cure 2 weeks at 50–60°F, then store dark at 38–40°F.',
    problems: ['Colorado potato beetle', 'Late blight', 'Scab in alkaline soil'], friends: ['beans', 'corn', 'cabbage', 'marigold', 'horseradish'], avoid: ['tomato', 'pumpkin', 'zucchini', 'cucumber', 'sunflower', 'raspberry'],
  },
  {
    id: 'sweetpotato', name: 'Sweet potato', latin: 'Ipomoea batatas', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: 'Vines to 6 ft',
    sow: 'Plant rooted slips 3–4 weeks after last frost, when soil is 65°F.', days: '90–120 days',
    care: ['Loose soil grows straight roots; raised beds are ideal.', 'Very drought tolerant once established.'],
    harvest: 'Dig before frost. Cure 7–10 days at 80–85°F with high humidity to turn starch to sugar, then store at 55–60°F (never in the fridge).',
    problems: ['Wireworms', 'Deer love the leaves'], friends: ['beans', 'thyme', 'oregano'], avoid: ['pumpkin'], note: 'The young leaves are edible cooked like spinach.',
  },
  {
    id: 'carrot', name: 'Carrot', latin: 'Daucus carota', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 3, height: '1 ft (tops)',
    sow: 'Direct sow ¼ inch deep from 3 weeks before last frost; keep the surface moist for the 2–3 weeks they take to sprout.', days: '60–80 days',
    care: ['Thin to 2–3 inches apart or roots stay skinny.', 'Rocks and clods make forked roots; raised beds help.', 'Cover shoulders with soil to stop green tops.'],
    harvest: 'Pull when shoulders are ¾–1 inch wide. Fall carrots get sweeter after a frost.',
    problems: ['Carrot rust fly', 'Forked roots', 'Poor germination (soil dried out)'], friends: ['onion', 'leek', 'chives', 'rosemary', 'sage', 'lettuce', 'tomato', 'peas', 'radish'], avoid: ['dill', 'parsnip'], area: 'bed',
  },
  {
    id: 'beet', name: 'Beet', latin: 'Beta vulgaris', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1 ft',
    sow: 'Direct sow ½ inch deep 2–4 weeks before last frost and again in late summer. Each "seed" is a cluster, so thin.', days: '50–70 days',
    care: ['Thin to 3–4 inches; eat the thinnings as greens.'], harvest: 'Pull at golf-ball to tennis-ball size. Twist off tops leaving an inch so they don\'t bleed.',
    problems: ['Leaf miners', 'Woody roots in heat'], friends: ['onion', 'garlic', 'lettuce', ...BRASSICAS, 'bushbeans'], avoid: ['beans'],
  },
  {
    id: 'radish', name: 'Radish', latin: 'Raphanus sativus', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 2, height: '6 in',
    sow: 'Direct sow ½ inch deep from 4 weeks before last frost; repeat every 10 days in cool weather.', days: '25–30 days',
    care: ['Fast and easy: great for marking rows of slow carrots.', 'They bolt and turn hot in summer heat.'], harvest: 'Pull as soon as roots size up; they go pithy quickly.',
    problems: ['Flea beetles', 'Root maggots'], friends: ['lettuce', 'carrot', 'cucumber', 'zucchini', 'peas', 'spinach'], avoid: [],
  },
  {
    id: 'turnip', name: 'Turnip', latin: 'Brassica rapa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1 ft',
    sow: 'Direct sow in early spring or, better, late summer for a fall crop.', days: '40–60 days',
    care: ['Grows best in cool weather. Greens are edible too.'], harvest: 'Pull at 2–3 inches across for tender roots.',
    problems: ['Flea beetles', 'Root maggots'], friends: ['peas', 'onion'], avoid: ['potato'],
  },
  {
    id: 'parsnip', name: 'Parsnip', latin: 'Pastinaca sativa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1.5 ft',
    sow: 'Direct sow fresh seed (it doesn\'t keep) in spring; slow to sprout, up to 3 weeks.', days: '110–130 days',
    care: ['Deep, loose soil for long roots.'], harvest: 'Leave in the ground until after a few frosts for sweetness; dig through winter.',
    problems: ['Carrot rust fly', 'Sap can burn skin in sunlight: wear gloves when weeding'], friends: ['onion', 'radish', 'peas'], avoid: ['carrot'],
  },
  {
    id: 'onion', name: 'Onion', latin: 'Allium cepa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1.5 ft',
    sow: 'Plant sets or transplants 4–6 weeks before last frost. Choose short-, intermediate- or long-day types for your latitude.', days: '90–120 days',
    care: ['Shallow roots: weed carefully and water regularly.', 'Stop watering once tops start to flop.'],
    harvest: 'When most tops fall over, pull and cure 2–3 weeks somewhere airy and dry until necks are papery.',
    problems: ['Onion thrips', 'Bolting from cold stress', 'Neck rot in storage'], friends: ['carrot', 'beet', 'lettuce', 'tomato', 'pepper', ...BRASSICAS, 'strawberry'], avoid: ['beans', 'bushbeans', 'peas', 'asparagus'],
  },
  {
    id: 'garlic', name: 'Garlic', latin: 'Allium sativum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: '2 ft',
    sow: 'Plant cloves pointy end up, 2 inches deep, in fall about 4–6 weeks before the ground freezes. Mulch over winter.', days: '8–9 months (overwinter)',
    care: ['Cut off hardneck scapes in early summer (and eat them).', 'Stop watering a couple of weeks before harvest.'],
    harvest: 'Dig when the lower third of leaves have browned. Cure 3–4 weeks hanging in shade, then store cool and dry.',
    problems: ['White rot', 'Small bulbs (planted late or crowded)'], friends: ['tomato', 'carrot', 'beet', 'lettuce', ...BRASSICAS, 'rose', 'strawberry'], avoid: ['beans', 'bushbeans', 'peas', 'asparagus'], area: 'pantry',
  },
  {
    id: 'leek', name: 'Leek', latin: 'Allium porrum', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 6, height: '2–3 ft',
    sow: 'Start indoors 10–12 weeks before last frost; transplant into 6-inch-deep holes and water in without backfilling.', days: '100–120 days',
    care: ['Hill soil around the shafts as they grow to blanch them white.'], harvest: 'Dig from late summer through winter; very cold hardy.',
    problems: ['Leek moth', 'Gritty shafts (rinse well)'], friends: ['carrot', 'celery', 'onion'], avoid: ['beans', 'peas'],
  },
  {
    id: 'asparagus', name: 'Asparagus', latin: 'Asparagus officinalis', type: 'veg', life: 'perennial', zones: [3, 8], sun: 'full', water: 'medium', spacing: 18, height: '4–6 ft (ferns)',
    sow: 'Plant 1-year crowns in early spring in a trench 6–8 inches deep, filling it in gradually as spears grow.', days: 'Light harvest year 2, full from year 3',
    care: ['A bed lasts 15–20 years, so prepare it well and weed it ruthlessly.', 'Leave ferns standing until they brown in fall; they feed the roots.'],
    harvest: 'Snap spears at 6–8 inches for 2 weeks in year 2, 6–8 weeks from year 3. Stop when spears go pencil-thin.',
    problems: ['Asparagus beetle', 'Weeds'], friends: ['tomato', 'parsley', 'basil'], avoid: ['onion', 'garlic', 'potato'],
  },
  {
    id: 'rhubarb', name: 'Rhubarb', latin: 'Rheum rhabarbarum', type: 'veg', life: 'perennial', zones: [3, 8], sun: 'full', water: 'medium', spacing: 36, height: '2–3 ft',
    sow: 'Plant crowns in early spring with buds 2 inches below the surface.', days: 'Light harvest year 2',
    care: ['Needs winter cold. Feed with compost each spring.', 'Cut off flower stalks as they appear.'],
    harvest: 'Pull (don\'t cut) stalks when 12–18 inches; take no more than a third of the plant.',
    problems: ['The leaves are poisonous (oxalic acid): eat stalks only'], friends: ['strawberry', ...BRASSICAS], avoid: [],
  },
];
