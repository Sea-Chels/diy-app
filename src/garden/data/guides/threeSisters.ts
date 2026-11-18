import type { Guide } from '../guides';

export const THREE_SISTERS_GUIDES: Guide[] = [
  {
    id: 'three-sisters', title: 'Plant a Three Sisters mound', areas: ['sisters'], aliases: ['corn beans squash', 'milpa', 'indigenous', 'guild', 'companion'],
    kind: 'grow', difficulty: 2, minutes: [60, 120], wait: 'Over 3 weeks: corn first, then beans, then squash',
    tools: ['Shovel and rake', 'Measuring tape'], supplies: ['Flint, dent or tall sweet corn seed', 'Pole bean seed (runner or heirloom)', 'Winter squash or pumpkin seed', 'Compost'],
    summary: 'A planting tradition from many Indigenous nations of the Americas. Corn gives beans a pole, bean roots host bacteria that add nitrogen, and big squash leaves shade out weeds and hold moisture.',
    steps: [
      'After last frost, build mounds about 12 inches high and 18–20 inches across, 3–4 ft apart, mixing in compost.',
      'Sow 4–6 corn seeds in a 6 inch circle on top of each mound.',
      'When corn is 4–6 inches tall (about 2 weeks), sow 4 bean seeds around each mound, a few inches from the corn.',
      'About a week later, sow squash seeds on the sides of the mounds or in separate mounds between them.',
      'Thin corn to the strongest 4 per mound. Guide bean tendrils onto the corn stalks.',
      'Plant a block of at least 4×4 mounds so the corn pollinates well.',
    ],
    cautions: ['Fast modern sweet corn can get pulled over by vigorous beans; tall, sturdy flint or dent corn and less aggressive beans work best.'],
    plants: ['corn', 'beans', 'pumpkin'], query: 'three sisters garden planting corn beans squash mounds', featured: true,
  },
  {
    id: 'powdery-mildew', title: 'White powder on squash leaves', areas: ['sisters', 'kitchen'], aliases: ['powdery mildew', 'white leaves', 'fungus', 'zucchini leaves'],
    kind: 'fix', difficulty: 1, minutes: [10, 20],
    tools: ['Clean pruners', 'Spray bottle'], supplies: ['Potassium bicarbonate or a sulfur-based fungicide (organic options)', 'Resistant varieties next year'],
    summary: 'Powdery mildew looks like talcum powder on leaves. It loves warm days, cool nights and crowded plants, and mostly shows up late in the season.',
    steps: [
      'Remove the worst leaves (no more than a third of the plant).',
      'Water the soil, not the leaves, and give plants room to breathe.',
      'Spray remaining leaves with potassium bicarbonate at the label rate as soon as spots appear; repeat weekly.',
      'Next year pick mildew-resistant varieties and space wider.',
    ],
    plants: ['zucchini', 'pumpkin', 'cucumber'], query: 'powdery mildew squash organic treatment',
  },
  {
    id: 'hand-pollinate', title: 'Squash flowers but no fruit', areas: ['sisters', 'kitchen'], aliases: ['no fruit', 'fruit falls off', 'hand pollination', 'male female flower', 'pollinate'],
    kind: 'fix', difficulty: 1, minutes: [5, 15],
    tools: ['Small paintbrush or cotton swab'], supplies: [],
    summary: 'Squash have separate male and female flowers, and males come first. If tiny fruits shrivel, they weren\'t pollinated: be the bee.',
    steps: [
      'Find a female flower: it has a mini squash at its base. Males sit on a plain thin stalk.',
      'Early in the morning, when flowers are open, pick a male flower and peel back its petals.',
      'Dab its pollen-covered centre onto the female flower\'s stigma.',
      'Plant flowers nearby to bring more pollinators, and avoid spraying when bees are out.',
    ],
    plants: ['zucchini', 'pumpkin', 'cucumber', 'melon'], query: 'hand pollinate squash male female flowers',
  },
  {
    id: 'squash-borer', title: 'Squash plant suddenly wilts', areas: ['sisters'], aliases: ['squash vine borer', 'wilting', 'frass', 'squash bugs', 'collapsed'],
    kind: 'fix', difficulty: 2, minutes: [15, 30],
    tools: ['Sharp knife', 'Soil'], supplies: ['Row cover', 'Aluminium foil'],
    summary: 'A healthy plant that wilts on a sunny day, with sawdust-like frass near the base, has a squash vine borer grub tunneling inside the stem.',
    steps: [
      'Find the hole and frass; slit the stem lengthwise above it with a knife and remove the grub.',
      'Bury the wounded part of the stem in moist soil so it roots again, and water well.',
      'Next year cover young plants with row cover until they flower (then remove for pollination).',
      'Wrap the base of stems in foil, or grow resistant butternut squash.',
      'For squash bugs, check leaf undersides for bronze egg clusters and scrape them off.',
    ],
    plants: ['zucchini', 'pumpkin'], query: 'squash vine borer remove save plant',
  },
];
