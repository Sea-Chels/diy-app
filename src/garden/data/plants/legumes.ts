import type { Plant } from '../plants';

export const LEGUMES_PLANTS: Plant[] = [
  {
    id: 'beans', name: 'Pole beans', latin: 'Phaseolus vulgaris', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: 'Vines 6–10 ft',
    sow: 'Direct sow 1 inch deep after last frost when soil is 60°F. In a Three Sisters mound, sow when corn is 4–6 inches tall.', days: '60–70 days',
    care: ['Give them a pole, trellis or corn to climb.', 'Beans fix nitrogen with soil bacteria, so skip the nitrogen fertilizer.', 'Don\'t work among wet plants; it spreads disease.'],
    harvest: 'Pick snap beans before the seeds bulge, every 2–3 days. Leave some to dry on the vine for soup beans and next year\'s seed.',
    problems: ['Mexican bean beetle', 'Aphids', 'Rust'], friends: ['corn', 'pumpkin', 'zucchini', 'cucumber', 'carrot', 'potato', 'strawberry', 'marigold'], avoid: ['onion', 'garlic', 'leek', 'chives', 'fennel', 'beet'], area: 'sisters',
  },
  {
    id: 'bushbeans', name: 'Bush beans', latin: 'Phaseolus vulgaris', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 4, height: '1.5–2 ft',
    sow: 'Direct sow every 2–3 weeks from last frost to midsummer for a steady supply.', days: '50–60 days',
    care: ['No support needed. Mulch to keep pods off the soil.'], harvest: 'Most of the crop comes in one 2–3 week burst. Pick young.',
    problems: ['Mexican bean beetle', 'Rabbits'], friends: ['corn', 'cucumber', 'potato', 'strawberry', 'carrot', 'beet'], avoid: ['onion', 'garlic', 'chives', 'fennel'],
  },
  {
    id: 'peas', name: 'Peas', latin: 'Pisum sativum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 3, height: '2–6 ft',
    sow: 'Direct sow 4–6 weeks before last frost, as soon as soil can be worked. Sow again in late summer for fall.', days: '55–70 days',
    care: ['Give them netting or twiggy branches to climb.', 'Peas stall in heat over 80°F, so get them in early.'],
    harvest: 'Pick snap and snow peas while pods are crisp; shelling peas when pods are plump but still bright green.',
    problems: ['Powdery mildew in warm weather', 'Pea aphids', 'Birds pulling seedlings'], friends: ['carrot', 'radish', 'lettuce', 'spinach', 'turnip', 'cucumber'], avoid: ['onion', 'garlic', 'chives', 'leek'],
  },
  {
    id: 'corn', name: 'Sweet corn', latin: 'Zea mays', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '5–8 ft',
    sow: 'Direct sow after last frost when soil is 60°F. Plant in blocks of at least 4 rows (or Three Sisters mounds) so the wind pollinates every ear.', days: '65–90 days',
    care: ['Heavy feeder: work in compost and side-dress with nitrogen when knee high.', 'Keep sweet corn types apart from popcorn and field corn or they cross.'],
    harvest: 'Ready 18–24 days after silks appear, when silks are brown and a punctured kernel squirts milky juice. Cook or chill right away.',
    problems: ['Corn earworm', 'Raccoons', 'Poorly filled ears (pollination)'], friends: ['beans', 'pumpkin', 'zucchini', 'cucumber', 'melon', 'sunflower'], avoid: ['tomato'], area: 'sisters',
  },
];
