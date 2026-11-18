/**
 * The clickable areas of the garden. The 3D rig provides a pick proxy, a
 * beacon and a camera view for every AreaId; guides and plants key off these.
 */
export type AreaId =
  | 'bed'
  | 'kitchen'
  | 'sisters'
  | 'tunnel'
  | 'compost'
  | 'hydro'
  | 'fruit'
  | 'herbs'
  | 'pantry'
  | 'water'
  | 'pollinators'
  | 'seedlings'
  | 'arbor'
  | 'tools';

/** Things that move out of the way so an area can be seen. */
export const LIDS = ['bedFront', 'shedDoors', 'compostSlats', 'rowCover'] as const;
export type LidId = (typeof LIDS)[number];

export interface AreaInfo {
  id: AreaId;
  label: string;
  blurb: string;
  related?: AreaId[];
  opens?: LidId[];
}

export const AREAS: Record<AreaId, AreaInfo> = {
  bed: { id: 'bed', label: 'Raised bed: build & fill', blurb: 'A galvanized bed with its front cut away: logs, branches, cardboard and greens break down under the soil and feed it all season.', related: ['kitchen', 'compost'], opens: ['bedFront'] },
  kitchen: { id: 'kitchen', label: 'Kitchen bed', blurb: 'Tomatoes in cages with basil, marigolds and nasturtiums: a classic companion bed.', related: ['bed', 'sisters'] },
  sisters: { id: 'sisters', label: 'Three Sisters', blurb: 'Corn gives the beans a pole, beans feed the soil with nitrogen, and squash shades out weeds.', related: ['kitchen', 'pollinators'] },
  tunnel: { id: 'tunnel', label: 'Hoop tunnel', blurb: 'Hoops and row cover over a cedar bed: frost protection in spring and fall, and a shield from cabbage moths.', related: ['bed', 'seedlings'], opens: ['rowCover'] },
  compost: { id: 'compost', label: 'Compost bays', blurb: 'Three bays: fresh scraps, a cooking pile, and finished compost ready for the beds.', related: ['bed', 'tools'], opens: ['compostSlats'] },
  hydro: { id: 'hydro', label: 'Hydroponics', blurb: 'Plants grown in water and nutrients, no soil. Build a PVC tower, an NFT rack or a deep-water tote.', related: ['water', 'seedlings'] },
  fruit: { id: 'fruit', label: 'Fruit corner', blurb: 'A pawpaw tree, a goji bush and blueberries in acid soil.', related: ['pollinators', 'tools'] },
  herbs: { id: 'herbs', label: 'Herb spiral', blurb: 'A stone spiral: dry, sunny top for Mediterranean herbs, moist base for mint, chives and marshmallow.', related: ['pollinators', 'pantry'] },
  pantry: { id: 'pantry', label: 'Shed pantry', blurb: 'Canned, pickled, dried and root-cellared harvest. Open the doors for safe food storage.', related: ['herbs', 'kitchen'], opens: ['shedDoors'] },
  water: { id: 'water', label: 'Rain barrel & watering', blurb: 'Catch rain off the shed roof and feed it to the beds with a drip line or a can.', related: ['hydro', 'bed'] },
  pollinators: { id: 'pollinators', label: 'Pollinator patch', blurb: 'Sunflowers, zinnias, cosmos and a bee hotel bring the bees and butterflies that set your fruit.', related: ['sisters', 'fruit'] },
  seedlings: { id: 'seedlings', label: 'Potting bench', blurb: 'Start seeds in trays, pot them up, and harden them off before planting out.', related: ['tunnel', 'hydro'] },
  arbor: { id: 'arbor', label: 'Arbor & climbers', blurb: 'Roses and vines trained up a cedar arbor. Grow up to save space.', related: ['pollinators', 'tools'] },
  tools: { id: 'tools', label: 'Tool fence', blurb: 'Spade, rake, hoe, pruners and loppers. Clean, sharp tools make every job easier.', related: ['compost', 'fruit'] },
};

/** Order areas are listed in the guide index. */
export const AREA_ORDER: AreaId[] = ['bed', 'kitchen', 'sisters', 'tunnel', 'seedlings', 'compost', 'water', 'hydro', 'herbs', 'fruit', 'pollinators', 'arbor', 'pantry', 'tools'];
