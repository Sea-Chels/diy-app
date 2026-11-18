import type { Guide } from '../guides';

export const TOOLS_GUIDES: Guide[] = [
  {
    id: 'sharpen-tools', title: 'Sharpen pruners, hoes and shovels', areas: ['tools'], aliases: ['sharpen', 'dull pruners', 'blade', 'file', 'shovel edge', 'tool care'],
    kind: 'fix', difficulty: 1, minutes: [20, 45], savings: 'sharp tools work faster and last longer',
    tools: ['Mill bastard file (for shovels and hoes)', 'Diamond file or whetstone (for pruners)', 'Vise or clamps', 'Wire brush, steel wool', 'Gloves and eye protection'],
    supplies: ['Light machine oil or camellia oil', 'Rubbing alcohol'],
    summary: 'Dull pruners crush stems (inviting disease) and dull spades make digging twice as hard. A file and ten minutes fixes both.',
    steps: [
      'Clean off soil and sap; scrub rust with a wire brush or steel wool. Disinfect pruners with rubbing alcohol.',
      'Clamp the tool firmly.',
      'Spades and hoes: file along the original bevel, pushing away from you on the inside edge, until bright metal shows. Aim for a 45° edge, not knife-sharp.',
      'Pruners: take them apart if you can, then stroke a diamond file along the bevelled side of the cutting blade only, keeping the angle. Rub off the burr from the flat side lightly.',
      'Reassemble, oil the pivot and wipe a thin coat of oil over the metal.',
    ],
    query: 'how to sharpen pruners and garden shovel file', featured: true,
  },
  {
    id: 'store-tools', title: 'Clean, store and repair tools for winter', areas: ['tools'], aliases: ['winterize', 'rust', 'broken handle', 'replace handle', 'linseed oil'],
    kind: 'fix', difficulty: 2, minutes: [30, 90],
    tools: ['Wire brush', 'Drill and bits (for handle rivets)', 'Hammer', 'Sandpaper'],
    supplies: ['Boiled linseed oil for wooden handles', 'Machine oil', 'Replacement handle (if needed)', 'Bucket of sand mixed with a little oil (optional)'],
    summary: 'Tools left dirty and wet rust and their handles splinter. A clean, oiled tool hung up off the ground lasts decades.',
    steps: [
      'Hose off soil, dry thoroughly and scrub off rust.',
      'Sand rough handles and rub in boiled linseed oil; let it soak in, wipe off the excess.',
      'Oil metal parts and pivots.',
      'For a broken handle, drill out the rivet, knock out the stub, fit a new handle and fix it with a new rivet or screw.',
      'Hang tools on a wall rack so edges stay sharp and nothing sits in a damp pile.',
      'Drain and coil hoses, and empty sprayers.',
    ],
    cautions: ['Rags soaked in linseed oil can catch fire by themselves: lay them flat outside to dry before throwing them away.'],
    query: 'clean and store garden tools winter replace handle',
  },
  {
    id: 'clean-pruners', title: 'Disinfect pruners between plants', areas: ['tools', 'fruit'], aliases: ['disinfect', 'spread disease', 'fire blight', 'clean blades'],
    kind: 'grow', difficulty: 1, minutes: [2, 5],
    tools: ['Pruners'], supplies: ['70% rubbing alcohol in a spray bottle, or disinfecting wipes'],
    summary: 'Pruners can carry diseases like fire blight and viruses from plant to plant. A quick wipe between plants stops that.',
    steps: [
      'Spray or wipe both blades with 70% alcohol between plants, and between cuts on anything diseased.',
      'Let it evaporate for a few seconds.',
      'Bleach works but corrodes steel; if you use it, rinse and oil afterwards.',
    ],
    query: 'disinfect pruning shears between plants',
  },
];
