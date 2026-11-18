/**
 * The clickable areas of the cutaway house. The 3D rig provides a pick proxy,
 * a beacon and a camera view for every AreaId; guides key off these.
 */
export type AreaId =
  | 'counters'
  | 'sink'
  | 'appliances'
  | 'window'
  | 'toilet'
  | 'bath'
  | 'utility'
  | 'outlets'
  | 'wall'
  | 'door'
  | 'lights'
  | 'paint'
  | 'floor'
  | 'gutters'
  | 'exterior';

/** Things that move out of the way so an area can be seen. */
export const LIDS = ['sinkDoors', 'sash', 'tankLid', 'vanityDoors', 'panelDoor', 'coverPlates', 'frontDoor', 'canopy', 'drawer', 'planks', 'gutterGuard', 'sidingPanel'] as const;
export type LidId = (typeof LIDS)[number];

export interface AreaInfo {
  id: AreaId;
  label: string;
  blurb: string;
  related?: AreaId[];
  opens?: LidId[];
}

export const AREAS: Record<AreaId, AreaInfo> = {
  counters: { id: 'counters', label: 'Countertops & backsplash', blurb: 'Swap a tired counter for laminate, butcher block or stone, tile a backsplash and keep the seams sealed.', related: ['sink', 'appliances'] },
  sink: { id: 'sink', label: 'Kitchen sink & faucet', blurb: 'Drips, clogs, a jammed disposal, a new faucet. The cabinet doors open to show the trap and shut-off valves.', related: ['counters', 'bath'], opens: ['sinkDoors'] },
  appliances: { id: 'appliances', label: 'Appliances', blurb: 'The range and hood, the dishwasher and the fridge: swap them, hook them up and fix the common faults.', related: ['counters', 'outlets'] },
  window: { id: 'window', label: 'Window', blurb: 'Replace a window, seal the drafts, free a stuck sash and fix broken glass or screens.', related: ['door', 'paint'], opens: ['sash'] },
  toilet: { id: 'toilet', label: 'Toilet', blurb: 'Running, clogged, rocking or weak. The tank lid lifts so you can see the flapper, fill valve and chain.', related: ['bath', 'utility'], opens: ['tankLid'] },
  bath: { id: 'bath', label: 'Tub & vanity', blurb: 'Recaulk the tub, clear slow drains, swap a faucet or showerhead and freshen the grout.', related: ['toilet', 'sink'], opens: ['vanityDoors'] },
  utility: { id: 'utility', label: 'Shut-offs & safety', blurb: 'The breaker panel, the main water valve, the thermostat and the smoke alarm: know where they are before you need them.', related: ['outlets', 'toilet'], opens: ['panelDoor'] },
  outlets: { id: 'outlets', label: 'Outlets & switches', blurb: 'Replace an outlet, add a GFCI, swap a switch or dimmer. The cover plates come off to show the wiring.', related: ['utility', 'lights'], opens: ['coverPlates'] },
  wall: { id: 'wall', label: 'Drywall', blurb: 'A doorknob went through the wall. Patch holes of every size, cracks and nail pops, then paint.', related: ['paint', 'door'] },
  door: { id: 'door', label: 'Front door', blurb: 'Replace a door, fix one that sticks or won\'t latch, weatherstrip it and swap the locks.', related: ['window', 'wall'], opens: ['frontDoor'] },
  lights: { id: 'lights', label: 'Lights & ceiling fan', blurb: 'Swap a light fixture or hang a fan. The canopy drops to show the fan-rated box and the wires.', related: ['outlets', 'utility'], opens: ['canopy'] },
  paint: { id: 'paint', label: 'Stripping & refinishing', blurb: 'An old dresser, half stripped. Take paint off wood safely, then sand and refinish it.', related: ['wall', 'floor'], opens: ['drawer'] },
  floor: { id: 'floor', label: 'Floors', blurb: 'The planks lift to show the underlayment and subfloor. Fix squeaks, lay new floors and replace a cracked tile.', related: ['paint', 'bath'], opens: ['planks'] },
  gutters: { id: 'gutters', label: 'Gutters & drainage', blurb: 'Clogged gutters overflow and soak the foundation. Clean them, fix leaks and sags, and send the water away from the house. The guard lifts to show the leaves.', related: ['exterior', 'window'], opens: ['gutterGuard'] },
  exterior: { id: 'exterior', label: 'Siding & outside', blurb: 'The outside walls: a loose siding panel, a dripping hose bib, the porch light and an outdoor outlet. The panel unzips to show the house wrap.', related: ['gutters', 'door'], opens: ['sidingPanel'] },
};

/** Order areas are listed in the guide index. */
export const AREA_ORDER: AreaId[] = ['sink', 'counters', 'appliances', 'toilet', 'bath', 'outlets', 'lights', 'utility', 'wall', 'paint', 'window', 'door', 'floor', 'exterior', 'gutters'];
