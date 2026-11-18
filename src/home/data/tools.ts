/**
 * The toolbox. Guides list tools by these ids (anything else is shown as
 * plain text), so marking a tool as owned shows which guides you're ready for.
 */
export type ToolCat = 'starter' | 'electrical' | 'plumbing' | 'carpentry' | 'walls' | 'floors' | 'outside';
export const CAT_LABEL: Record<ToolCat, string> = {
  starter: 'Starter kit',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
  walls: 'Drywall & paint',
  floors: 'Tile & floors',
  outside: 'Outside & up high',
};

export interface Tool {
  id: string;
  name: string;
  cat: ToolCat;
  /** What it's for, in a line. */
  use: string;
  cost: '$' | '$$' | '$$$';
  /** Worth buying before you need it. */
  starter?: boolean;
}

export const TOOLS: Tool[] = [
  { id: 'screwdriver', name: 'Multi-bit screwdriver', cat: 'starter', use: 'Phillips, flat and square bits in one handle. Cover plates, hinges, appliances.', cost: '$', starter: true },
  { id: 'drill', name: 'Cordless drill/driver', cat: 'starter', use: 'Drives screws and drills holes. Get one with two batteries.', cost: '$$', starter: true },
  { id: 'tape', name: 'Tape measure (25 ft)', cat: 'starter', use: 'Measure twice, buy once.', cost: '$', starter: true },
  { id: 'level', name: 'Level (2 ft and a torpedo)', cat: 'starter', use: 'Shelves, doors, windows, appliances and toilets.', cost: '$', starter: true },
  { id: 'hammer', name: 'Claw hammer', cat: 'starter', use: 'Nails, nudging things into place, pulling nails.', cost: '$', starter: true },
  { id: 'knife', name: 'Utility knife', cat: 'starter', use: 'Scoring drywall, cutting caulk and paint lines, opening boxes. Keep spare blades.', cost: '$', starter: true },
  { id: 'pliers', name: 'Pliers (slip-joint and needle-nose)', cat: 'starter', use: 'Gripping, bending wire, pulling staples.', cost: '$', starter: true },
  { id: 'wrench', name: 'Adjustable wrench', cat: 'starter', use: 'Supply lines, compression nuts and bolts.', cost: '$', starter: true },
  { id: 'putty-knife', name: 'Putty knife (1½ in)', cat: 'starter', use: 'Spackle, scraping, prying trim gently.', cost: '$', starter: true },
  { id: 'headlamp', name: 'Headlamp or flashlight', cat: 'starter', use: 'Under sinks, inside cabinets, when the power is off.', cost: '$', starter: true },
  { id: 'glasses', name: 'Safety glasses', cat: 'starter', use: 'Every time you cut, scrape, drill overhead or work under pressure.', cost: '$', starter: true },
  { id: 'gloves', name: 'Work and nitrile gloves', cat: 'starter', use: 'Splinters, sharp edges, caulk, chemicals.', cost: '$', starter: true },
  { id: 'stud-finder', name: 'Stud finder', cat: 'starter', use: 'Find framing before you hang anything heavy or cut a wall.', cost: '$', starter: true },
  { id: 'caulk-gun', name: 'Caulk gun', cat: 'starter', use: 'Silicone and acrylic caulk, construction adhesive.', cost: '$', starter: true },
  { id: 'ladder', name: 'Step ladder (6 ft)', cat: 'starter', use: 'Ceiling lights, fans, smoke alarms. Never stand on the top step.', cost: '$$', starter: true },
  { id: 'extension-ladder', name: 'Extension ladder', cat: 'outside', use: 'Gutters, siding and second-floor windows. Set it 1 ft out for every 4 ft of height.', cost: '$$$' },
  { id: 'bucket', name: 'Bucket and old towels', cat: 'starter', use: 'Catch water under traps and supply lines.', cost: '$', starter: true },

  { id: 'voltage-tester', name: 'Non-contact voltage tester', cat: 'electrical', use: 'Beeps near a live wire. Check it on a known live outlet before trusting it.', cost: '$', starter: true },
  { id: 'outlet-tester', name: 'Plug-in outlet tester', cat: 'electrical', use: 'Shows wiring faults (open ground, reversed hot/neutral) and trips GFCIs.', cost: '$' },
  { id: 'strippers', name: 'Wire strippers', cat: 'electrical', use: 'Strip insulation cleanly and bend hooks for terminal screws.', cost: '$' },
  { id: 'multimeter', name: 'Multimeter', cat: 'electrical', use: 'Continuity and resistance for heating elements, switches and fuses.', cost: '$$' },

  { id: 'plunger-sink', name: 'Cup plunger', cat: 'plumbing', use: 'Flat-bottomed, for sinks and tubs.', cost: '$' },
  { id: 'plunger-toilet', name: 'Flange plunger', cat: 'plumbing', use: 'Has a fold-out lip that seals in a toilet drain.', cost: '$', starter: true },
  { id: 'snake', name: 'Hand drain snake (¼ in)', cat: 'plumbing', use: 'Reaches clogs past the trap in sinks and tubs.', cost: '$' },
  { id: 'closet-auger', name: 'Toilet (closet) auger', cat: 'plumbing', use: 'Snakes a toilet without scratching the bowl.', cost: '$' },
  { id: 'drain-stick', name: 'Barbed drain-cleaning strip', cat: 'plumbing', use: 'Plastic strip that pulls hair out of bathroom drains.', cost: '$' },
  { id: 'basin-wrench', name: 'Basin wrench', cat: 'plumbing', use: 'Reaches faucet nuts up behind the sink.', cost: '$' },
  { id: 'channel-locks', name: 'Tongue-and-groove pliers', cat: 'plumbing', use: 'Big slip nuts on traps, drains and supply valves.', cost: '$', starter: true },

  { id: 'circular-saw', name: 'Circular saw', cat: 'carpentry', use: 'Straight cuts in plywood, counters and framing.', cost: '$$' },
  { id: 'jigsaw', name: 'Jigsaw', cat: 'carpentry', use: 'Curves and sink cutouts.', cost: '$$' },
  { id: 'multitool', name: 'Oscillating multi-tool', cat: 'carpentry', use: 'Plunge cuts, undercutting door casing, removing grout and caulk.', cost: '$$' },
  { id: 'recip-saw', name: 'Reciprocating saw', cat: 'carpentry', use: 'Demolition: cutting nails behind jambs, old pipe, framing.', cost: '$$' },
  { id: 'pry-bar', name: 'Flat pry bar', cat: 'carpentry', use: 'Pulling trim, casing and old counters without wrecking them.', cost: '$' },
  { id: 'speed-square', name: 'Speed square', cat: 'carpentry', use: 'Square cuts and marking 90° and 45° lines.', cost: '$' },
  { id: 'clamps', name: 'Clamps', cat: 'carpentry', use: 'Hold guides, glue-ups and work pieces.', cost: '$' },
  { id: 'chisel', name: 'Wood chisels', cat: 'carpentry', use: 'Hinge and strike mortises.', cost: '$' },
  { id: 'block-plane', name: 'Block plane', cat: 'carpentry', use: 'Shave a sticking door edge.', cost: '$' },
  { id: 'sander', name: 'Random-orbit sander', cat: 'carpentry', use: 'Smooth, swirl-free sanding of wood and patches.', cost: '$$' },
  { id: 'mallet', name: 'Rubber mallet', cat: 'carpentry', use: 'Tap flooring, tile and parts together without marring.', cost: '$' },

  { id: 'taping-knives', name: 'Taping knives (6 and 10 in)', cat: 'walls', use: 'Spread and feather joint compound.', cost: '$' },
  { id: 'mud-pan', name: 'Mud pan', cat: 'walls', use: 'Holds joint compound while you work.', cost: '$' },
  { id: 'jab-saw', name: 'Drywall jab saw', cat: 'walls', use: 'Cut out damaged drywall and openings for boxes.', cost: '$' },
  { id: 'sanding-sponge', name: 'Sanding sponges', cat: 'walls', use: 'Fine and medium grit for patches and edges.', cost: '$', starter: true },
  { id: 'roller', name: 'Roller, tray and extension pole', cat: 'walls', use: 'Paint walls and ceilings.', cost: '$' },
  { id: 'brush', name: 'Angled sash brush (2½ in)', cat: 'walls', use: 'Cut in along ceilings, corners and trim.', cost: '$' },
  { id: 'drop-cloth', name: 'Drop cloths', cat: 'walls', use: 'Canvas for floors, plastic for containment.', cost: '$' },
  { id: 'heat-gun', name: 'Heat gun', cat: 'walls', use: 'Softens paint for scraping (only on lead-free paint), shrink film, stubborn adhesive.', cost: '$$' },
  { id: 'scraper', name: 'Paint scrapers (carbide and plastic)', cat: 'walls', use: 'Lift softened paint and old caulk.', cost: '$' },
  { id: 'hepa-vac', name: 'Shop vac with a HEPA filter', cat: 'walls', use: 'Dust control, especially around old paint.', cost: '$$' },
  { id: 'respirator', name: 'Respirator (P100 or N95)', cat: 'walls', use: 'Sanding dust. Organic-vapor cartridges for solvents and strippers.', cost: '$' },

  { id: 'trowel', name: 'Notched trowel', cat: 'floors', use: 'Spread thinset or mastic at the right thickness.', cost: '$' },
  { id: 'grout-float', name: 'Grout float and sponge', cat: 'floors', use: 'Pack grout and wipe the haze off.', cost: '$' },
  { id: 'grout-saw', name: 'Grout saw', cat: 'floors', use: 'Rake out old grout by hand.', cost: '$' },
  { id: 'tile-cutter', name: 'Tile cutter or wet saw', cat: 'floors', use: 'Score-and-snap for ceramic; rent a wet saw for porcelain and stone.', cost: '$$' },
  { id: 'flooring-kit', name: 'Flooring kit (tapping block, pull bar, spacers)', cat: 'floors', use: 'Lock click floors together without damaging the edges.', cost: '$' },
];

export const TOOL_BY_ID = new Map(TOOLS.map((t) => [t.id, t]));
