import type { Guide } from '../guides';

export const ARBOR_GUIDES: Guide[] = [
  {
    id: 'build-arbor', title: 'Build a garden arbor', areas: ['arbor'], aliases: ['arbor', 'pergola', 'trellis', 'archway', 'climbing'],
    kind: 'build', difficulty: 3, minutes: [300, 600],
    tools: ['Post-hole digger', 'Circular saw and jigsaw', 'Drill/driver', 'Level, square, clamps', 'Ladder'],
    supplies: ['Four 4×4 cedar posts (8 ft)', '2×6 beams and 2×2 rafters', 'Lattice or cattle panel for the sides', 'Gravel and concrete or post bases', 'Exterior screws or carriage bolts'],
    summary: 'A cedar arbor over a path gives climbing roses, grapes, beans or squash something to cover. Build the two sides flat on the ground, then stand them up.',
    steps: [
      'Mark post positions about 4 ft wide across the path and 2 ft deep.',
      'Build each side flat: two posts joined by lattice or cattle panel and a couple of cross pieces.',
      'Dig holes 2 ft deep (below frost line where needed), add gravel, stand the sides up and brace them plumb.',
      'Set posts in concrete or tamped gravel.',
      'Cut decorative ends on the beams with a jigsaw, then bolt them across the tops of the posts.',
      'Screw rafters on top every 8–12 inches.',
      'Plant climbers at the base, 6–12 inches out from each post.',
    ],
    plants: ['rose', 'grape', 'kiwi', 'hops', 'luffa'], query: 'DIY garden arbor build cedar',
  },
  {
    id: 'prune-roses', title: 'Prune and train climbing roses', areas: ['arbor'], aliases: ['roses', 'climbing rose', 'pruning roses', 'no flowers'],
    kind: 'grow', difficulty: 2, minutes: [30, 60],
    tools: ['Bypass pruners', 'Loppers', 'Thick gloves'], supplies: ['Soft ties'],
    summary: 'Climbers bloom on side shoots growing off long main canes. Tie canes as close to horizontal as you can and you\'ll get flowers all along them.',
    steps: [
      'In late winter, remove dead, damaged and very old woody canes at the base.',
      'Fan the remaining main canes out and tie them sideways or in a spiral up the arbor.',
      'Shorten the side shoots that flowered last year to 2–3 buds.',
      'Through summer, deadhead spent flowers (on repeat bloomers) and tie in new canes as they grow.',
      'Water at the base and clear fallen leaves to keep black spot down.',
    ],
    plants: ['rose', 'clematis'], query: 'how to prune climbing roses arbor',
  },
  {
    id: 'grow-vertical', title: 'Grow cucumbers, beans and squash up', areas: ['arbor', 'kitchen'], aliases: ['vertical gardening', 'trellis', 'cattle panel', 'climbing vegetables', 'save space'],
    kind: 'grow', difficulty: 1, minutes: [30, 60],
    tools: ['Zip ties', 'Fence pliers'], supplies: ['Cattle panel (16 ft) or sturdy netting', 'T-posts', 'Soft ties'],
    summary: 'Growing up saves space, keeps fruit clean and makes picking easy. A bent cattle panel makes an arch tunnel you can walk under.',
    steps: [
      'Pick a trellis strong enough for the crop: netting for peas and cucumbers, panels for squash and melons.',
      'Set the trellis on the north side of the bed so it doesn\'t shade other plants.',
      'Guide young vines onto it; beans twine on their own, cucumbers grab with tendrils, squash need tying.',
      'Support heavy melons and squash with slings made from old t-shirts or tights.',
    ],
    plants: ['cucumber', 'beans', 'peas', 'cucamelon', 'malabar', 'luffa'], query: 'cattle panel trellis arch vegetables',
  },
];
