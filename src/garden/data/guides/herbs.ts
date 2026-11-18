import type { Guide } from '../guides';

export const HERBS_GUIDES: Guide[] = [
  {
    id: 'herb-spiral', title: 'Build a herb spiral', areas: ['herbs'], aliases: ['spiral', 'herb garden', 'permaculture', 'stone spiral'],
    kind: 'build', difficulty: 2, minutes: [180, 360],
    tools: ['Shovel', 'Wheelbarrow', 'String and stake to mark the spiral'],
    supplies: ['Stones, bricks or broken concrete', 'Cardboard', 'Gravel or rubble for the core', 'Soil mixed with sand or grit for the top, compost-rich soil for the bottom'],
    summary: 'A spiral of stones about 6 ft across and 3 ft tall packs a lot of herbs into a small space, with a hot, dry top for Mediterranean herbs and a cool, moist bottom.',
    steps: [
      'Choose a sunny spot. Orient the low end of the spiral facing north-ish (south in the Southern Hemisphere) so the moist bottom gets some shade.',
      'Mark a 5–6 ft circle, lay cardboard to smother grass and soak it.',
      'Lay the first ring of stones in a spiral that winds inward.',
      'Fill the middle with gravel or rubble, then soil, building the wall up as you go so it rises toward the centre.',
      'Use gritty soil near the top and richer soil at the bottom.',
      'Plant rosemary, lavender, thyme and sage high up; chives, cilantro and parsley mid-way; mint (in a pot!), marshmallow or watercress at the foot.',
    ],
    plants: ['rosemary', 'thyme', 'sage', 'lavender', 'chives', 'marshmallow'], query: 'how to build a herb spiral', featured: true,
  },
  {
    id: 'harvest-herbs', title: 'Harvest herbs so they keep growing', areas: ['herbs', 'kitchen'], aliases: ['pinching', 'pruning herbs', 'basil flowering', 'leggy herbs', 'bolting'],
    kind: 'grow', difficulty: 1, minutes: [5, 15],
    tools: ['Sharp scissors or snips'], supplies: [],
    summary: 'Regular cutting makes most herbs bushier. Cut above a leaf pair, never take more than a third at once, and pinch off flowers on leafy herbs.',
    steps: [
      'Basil, mint, oregano: cut stems just above a pair of leaves; two new shoots will grow.',
      'Pinch off flower buds on basil and mint to keep the leaves coming.',
      'Rosemary, thyme, sage: snip soft green tips. Don\'t cut into old bare wood, it rarely resprouts.',
      'Parsley and cilantro: cut outer stems at the base.',
      'Harvest in the morning after the dew dries, when flavour is strongest.',
    ],
    plants: ['basil', 'mint', 'rosemary', 'thyme', 'parsley'], query: 'how to harvest basil and herbs properly',
  },
  {
    id: 'marshmallow-root', title: 'Grow and harvest marshmallow root', areas: ['herbs'], aliases: ['althaea', 'marshmallow', 'mucilage', 'root harvest', 'medicinal'],
    kind: 'grow', difficulty: 2, minutes: [30, 90], wait: 'Roots are ready in the fall of the second year',
    tools: ['Garden fork', 'Scrub brush', 'Sharp knife', 'Dehydrator or drying screen'], supplies: ['Seed (cold-stratified) or a root division'],
    summary: 'Marshmallow is a tall, velvety, pink-flowered perennial for damp ground. Its roots are dug in fall, sliced fresh and dried.',
    steps: [
      'Stratify seed in moist sand in the fridge for 3–4 weeks, then sow indoors in early spring.',
      'Plant out 2 ft apart in moist, rich soil with sun or part shade.',
      'Keep watered; cut stems down in late fall.',
      'In fall of year two, after the tops die back, dig the roots with a fork.',
      'Replant a few crown pieces with buds for next year.',
      'Scrub roots, slice them thin while fresh and dry at 95–115°F until brittle. Store in airtight jars.',
    ],
    cautions: ['This guide covers growing the plant, not medical use. Marshmallow may slow how medicines are absorbed; ask a pharmacist or doctor.'],
    plants: ['marshmallow'], query: 'marshmallow root althaea grow harvest',
  },
];
